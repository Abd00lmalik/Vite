import { ExecuteResult } from "@cosmjs/cosmwasm-stargate";

export type ExecuteArgs = {
  contractAddress: string;
  msg: any;
  senderAddress: string;
  signingClient: any;
};

export type XionSubmitter =
  | {
      mode: "session_execute";
      execute: (args: ExecuteArgs) => Promise<ExecuteResult>;
    }
  | {
      mode: "popup_sign_broadcast";
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

/**
 * SDK Audit: log the signing client's real capabilities at detection time.
 * This replaces guessing by constructor name with capability probing.
 */
function auditSigningClient(signingClient: any): {
  constructorName: string;
  hasExecute: boolean;
  hasSignAndBroadcast: boolean;
  hasSession: boolean;
  hasSignArb: boolean;
  protoKeys: string[];
  ownKeys: string[];
} {
  const proto = Object.getPrototypeOf(signingClient ?? {});
  return {
    constructorName: signingClient?.constructor?.name ?? "unknown",
    hasExecute: typeof signingClient?.execute === "function",
    hasSignAndBroadcast: typeof signingClient?.signAndBroadcast === "function",
    hasSession: Boolean(signingClient?.session),
    hasSignArb: typeof signingClient?.signArb === "function",
    protoKeys: proto ? Object.getOwnPropertyNames(proto) : [],
    ownKeys: Object.keys(signingClient ?? {}),
  };
}

/**
 * Resolve the correct signing adapter based on the client's ACTUAL capabilities,
 * not its minified constructor name.
 *
 * Priority order:
 * 1. Session execute — GranteeSignerClient (extends SigningCosmWasmClient).
 *    Has native .execute(). This is the preferred path when AbstraxionProvider
 *    is configured with `contracts` grants.
 * 2. Popup signAndBroadcast — PopupSigningClient / RedirectSigningClient / IframeSigningClient.
 *    Has .signAndBroadcast() but NO .execute(). Constructs EncodeObject manually.
 * 3. Server testnet fallback — only if explicitly enabled via env var.
 * 4. Unsupported — no known execution method found.
 */
export function getXionSubmitter(signingClient: any): XionSubmitter {
  if (!signingClient) {
    return { mode: "unsupported", reason: "No signing client provided" };
  }

  const audit = auditSigningClient(signingClient);

  console.log("[XION SDK AUDIT]", audit);

  // ── Path 1: Client has .execute() — GranteeSignerClient or AAClient ──────
  // GranteeSignerClient extends SigningCosmWasmClient which has .execute().
  // This is the session-key path where the user already approved grants.
  // The client handles MsgExec wrapping, fee grants, and gas internally.
  if (audit.hasExecute) {
    return {
      mode: "session_execute",
      execute: async ({ contractAddress, msg, senderAddress }) => {
        console.log("[XION SUBMIT] Using session .execute() path", {
          senderAddress,
          contractAddress,
          constructorName: audit.constructorName,
        });
        return await signingClient.execute(
          senderAddress,
          contractAddress,
          msg,
          "auto"
        );
      },
    };
  }

  // ── Path 2: Client has .signAndBroadcast() but no .execute() ─────────────
  // PopupSigningClient, RedirectSigningClient, IframeSigningClient.
  // These delegate to the dashboard popup/redirect/iframe for user approval.
  // We must construct the MsgExecuteContract EncodeObject manually.
  //
  // IMPORTANT: The popup transport JSON-serializes messages. The `msg` field
  // of MsgExecuteContract is `bytes` (Uint8Array) which doesn't survive
  // JSON.stringify. We use Array.from() to convert to a plain number array
  // which the dashboard can reconstruct.
  if (audit.hasSignAndBroadcast) {
    return {
      mode: "popup_sign_broadcast",
      execute: async ({ contractAddress, msg, senderAddress }) => {
        console.log("[XION SUBMIT] Using popup .signAndBroadcast() path", {
          senderAddress,
          contractAddress,
          constructorName: audit.constructorName,
        });

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

        return await signingClient.signAndBroadcast(
          senderAddress,
          [encodedMsg],
          "auto"
        );
      },
    };
  }

  // ── Path 3: Server testnet fallback (disabled by default) ────────────────
  if (process.env.NEXT_PUBLIC_XION_ENABLE_SERVER_SUBMIT === "true") {
    return {
      mode: "server_testnet",
      execute: async ({ contractAddress, msg, senderAddress }) => {
        console.warn(
          "[XION SUBMIT] Using server testnet fallback — NOT for production",
          { senderAddress, contractAddress }
        );
        const response = await fetch("/api/xion/submit-batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contractAddress,
            msg,
            originalSender: senderAddress,
          }),
        });
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || "Server submit failed");
        }
        return await response.json();
      },
    };
  }

  return {
    mode: "unsupported",
    reason: `Signing client "${audit.constructorName}" has neither .execute() nor .signAndBroadcast(). ` +
      `This usually means AbstraxionProvider is not configured with contract grants, ` +
      `so the session key has no permissions. Reconnect your XION wallet to approve grants.`,
  };
}
