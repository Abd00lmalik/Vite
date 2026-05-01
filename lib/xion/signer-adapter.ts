import { ExecuteResult } from "@cosmjs/cosmwasm-stargate";
import { XION, SHOW_XION_DEBUG } from "./config";

export type ExecuteArgs = {
  contractAddress: string;
  msg: any;
  senderAddress: string;
  signingClient: any;
};

export type SigningDiagnostics = {
  signingMode: string;
  feePayer: string;
  feegrantStatus: string;
  canSubmitTx: boolean;
  requiredAction: string;
};

export type XionSubmitter =
  | {
      mode: "session_execute";
      diagnostics: SigningDiagnostics;
      execute: (args: ExecuteArgs) => Promise<ExecuteResult>;
    }
  | {
      mode: "popup_direct";
      diagnostics: SigningDiagnostics;
      execute: (args: ExecuteArgs) => Promise<ExecuteResult>;
    }
  | {
      mode: "server_testnet";
      diagnostics: SigningDiagnostics;
      execute: (args: ExecuteArgs) => Promise<ExecuteResult>;
    }
  | {
      mode: "session_requires_feegrant";
      diagnostics: SigningDiagnostics;
      reason: string;
    }
  | {
      mode: "unsupported";
      diagnostics: SigningDiagnostics;
      reason: string;
    };

function auditClient(signingClient: any) {
  return {
    constructorName: signingClient?.constructor?.name ?? "unknown",
    hasExecute: typeof signingClient?.execute === "function",
    hasSignAndBroadcast: typeof signingClient?.signAndBroadcast === "function",
  };
}

const hasTreasury = Boolean(XION.treasury);

export function getXionSubmitter(signingClient: any): XionSubmitter {
  if (!signingClient) {
    return {
      mode: "unsupported",
      reason: "No signing client provided",
      diagnostics: {
        signingMode: "none",
        feePayer: "none",
        feegrantStatus: "n/a",
        canSubmitTx: false,
        requiredAction: "Connect XION wallet",
      },
    };
  }

  const audit = auditClient(signingClient);
  if (SHOW_XION_DEBUG) {
    console.log("[XION SDK AUDIT]", audit);
  }

  // ── Path 1: Session execute (GranteeSignerClient) ───────────────────────
  // Has .execute() → GranteeSignerClient or AAClient.
  // But REQUIRES treasury/feegrant for gas payment.
  if (audit.hasExecute) {
    if (!hasTreasury) {
      // Session client exists but cannot pay fees without treasury.
      // Mark as incompatible — do NOT attempt .execute().
      return {
        mode: "session_requires_feegrant",
        reason:
          "Session key signing requires fee sponsorship (treasury), but no treasury is configured. " +
          "Reconnect your XION wallet — the app will use direct signing where your wallet pays gas.",
        diagnostics: {
          signingMode: "Session Key (.execute)",
          feePayer: "none — treasury not configured",
          feegrantStatus: "MISSING",
          canSubmitTx: false,
          requiredAction: "Configure NEXT_PUBLIC_XION_TREASURY_ADDRESS or reconnect for direct signing",
        },
      };
    }

    // Treasury configured — session execute should work.
    return {
      mode: "session_execute",
      diagnostics: {
        signingMode: "Session Key (.execute)",
        feePayer: `Treasury: ${XION.treasury}`,
        feegrantStatus: "configured",
        canSubmitTx: true,
        requiredAction: "none",
      },
      execute: async ({ contractAddress, msg, senderAddress }) => {
        if (SHOW_XION_DEBUG) {
          console.log("[XION SUBMIT] Session .execute()", { senderAddress, contractAddress });
        }
        return await signingClient.execute(senderAddress, contractAddress, msg, "auto");
      },
    };
  }

  // ── Path 2: Popup direct signing (PopupSigningClient) ───────────────────
  // Has .signAndBroadcast() but no .execute().
  // User approves via popup, user's meta-account pays gas directly.
  // No treasury or feegrant needed.
  if (audit.hasSignAndBroadcast) {
    return {
      mode: "popup_direct",
      diagnostics: {
        signingMode: "Direct Signing (popup)",
        feePayer: "User wallet (meta-account)",
        feegrantStatus: "not required",
        canSubmitTx: true,
        requiredAction: "none — user approves each transaction in popup",
      },
      execute: async ({ contractAddress, msg, senderAddress }) => {
        if (SHOW_XION_DEBUG) {
          console.log("[XION SUBMIT] Popup .signAndBroadcast()", { senderAddress, contractAddress });
        }

        const { toUtf8 } = await import("@cosmjs/encoding");

        // For popup transport: the PopupController JSON-serializes messages for
        // the dashboard. Uint8Array doesn't survive JSON.stringify, so we encode
        // the contract msg as a plain number array which the dashboard can
        // reconstruct. This matches the Array.from pattern proven in prior iterations.
        const msgBytes = toUtf8(JSON.stringify(msg));

        const encodedMsg = {
          typeUrl: "/cosmwasm.wasm.v1.MsgExecuteContract",
          value: {
            sender: senderAddress,
            contract: contractAddress,
            msg: Array.from(msgBytes) as any,
            funds: [],
          },
        };

        return await signingClient.signAndBroadcast(senderAddress, [encodedMsg], "auto");
      },
    };
  }

  // ── Path 3: Server testnet fallback ─────────────────────────────────────
  if (process.env.NEXT_PUBLIC_XION_ENABLE_SERVER_SUBMIT === "true") {
    return {
      mode: "server_testnet",
      diagnostics: {
        signingMode: "Server Testnet Operator",
        feePayer: "Server wallet",
        feegrantStatus: "n/a (server-side)",
        canSubmitTx: true,
        requiredAction: "none — testnet fallback",
      },
      execute: async ({ contractAddress, msg, senderAddress }) => {
        if (SHOW_XION_DEBUG) {
          console.warn("[XION SUBMIT] Server testnet fallback", { senderAddress, contractAddress });
        }
        const response = await fetch("/api/xion/submit-batch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contractAddress, msg, originalSender: senderAddress }),
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
    reason: `Client "${audit.constructorName}" has no supported execution method.`,
    diagnostics: {
      signingMode: `Unknown (${audit.constructorName})`,
      feePayer: "unknown",
      feegrantStatus: "unknown",
      canSubmitTx: false,
      requiredAction: "Reconnect XION wallet",
    },
  };
}
