import { ExecuteResult } from "@cosmjs/cosmwasm-stargate";

export type ExecuteArgs = {
  contractAddress: string;
  msg: any;
  senderAddress: string;
  signingClient: any;
};

export type XionSubmitter =
  | {
      mode: "browser_direct";
      execute: (args: ExecuteArgs) => Promise<ExecuteResult>;
    }
  | {
      mode: "browser_session";
      execute: (args: ExecuteArgs) => Promise<ExecuteResult>;
    }
  | {
      mode: "server_testnet";
      execute: (args: ExecuteArgs) => Promise<ExecuteResult>;
    }
  | {
      mode: "unsupported";
      reason: string;
    };

export function getXionSubmitter(signingClient: any): XionSubmitter {
  if (!signingClient) {
    return { mode: "unsupported", reason: "No signing client provided" };
  }

  // Use case-insensitive check for minified names like iO, io
  const signingClientType = (signingClient?.constructor?.name ?? typeof signingClient).toLowerCase();
  const hasSession = Boolean(signingClient?.session);
  
  const isDirectPopup = 
    signingClientType === 'io' || 
    signingClientType.includes('popup') || 
    signingClientType.includes('redirect');

  // AAClient usually has an 'execute' method directly
  const isAAClient = 
    signingClientType.includes('aaclient') || 
    typeof signingClient.execute === 'function';

  if (isAAClient) {
    return {
      mode: "browser_direct",
      execute: async ({ contractAddress, msg, senderAddress }) => {
        return await signingClient.execute(senderAddress, contractAddress, msg, "auto");
      }
    };
  }

  if (isDirectPopup) {
    return {
      mode: "browser_direct",
      execute: async ({ contractAddress, msg, senderAddress }) => {
        if (typeof signingClient.signAndBroadcast !== 'function') {
          throw new Error(`Client ${signingClientType} does not support signAndBroadcast`);
        }
        
        // Use our proven Array.from encoding for popup transport
        const { toUtf8 } = await import("@cosmjs/encoding");
        const encodedMsg = {
          typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
          value: {
            sender: senderAddress,
            contract: contractAddress,
            msg: Array.from(toUtf8(JSON.stringify(msg))) as any,
            funds: [],
          },
        };

        return await signingClient.signAndBroadcast(senderAddress, [encodedMsg], "auto");
      }
    };
  }

  if (hasSession || signingClientType.includes('granteesignerclient')) {
    return {
      mode: "browser_session",
      execute: async ({ contractAddress, msg, senderAddress }) => {
        if (typeof signingClient.execute === 'function') {
          return await signingClient.execute(senderAddress, contractAddress, msg, "auto");
        }
        throw new Error("Session client does not support execute");
      }
    };
  }

  // Fallback to server if enabled
  if (process.env.NEXT_PUBLIC_XION_ENABLE_SERVER_SUBMIT === 'true') {
    return {
      mode: "server_testnet",
      execute: async ({ contractAddress, msg, senderAddress }) => {
        const response = await fetch('/api/xion/submit-batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contractAddress, msg, originalSender: senderAddress }),
        });
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || "Server submit failed");
        }
        return await response.json();
      }
    };
  }

  return { 
    mode: "unsupported", 
    reason: `Incompatible signing client type detected: ${signingClientType}` 
  };
}
