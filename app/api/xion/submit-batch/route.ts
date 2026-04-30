import { NextRequest, NextResponse } from 'next/server';
import { SigningCosmWasmClient } from "@cosmjs/cosmwasm-stargate";
import { DirectSecp256k1HdWallet } from "@cosmjs/proto-signing";
import { GasPrice } from "@cosmjs/stargate";

export async function POST(req: NextRequest) {
  try {
    // 1. Safety check
    if (process.env.XION_ENABLE_SERVER_SUBMIT !== 'true') {
      return NextResponse.json({ error: "Server submission is disabled" }, { status: 403 });
    }

    const mnemonic = process.env.XION_SERVER_MNEMONIC;
    if (!mnemonic) {
      return NextResponse.json({ error: "Server mnemonic not configured" }, { status: 500 });
    }

    const { contractAddress, msg, originalSender } = await req.json();

    if (!contractAddress || !msg) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 2. Setup signer
    const rpcUrl = process.env.NEXT_PUBLIC_XION_RPC_URL || "https://rpc.xion-testnet-2.burnt.com:443";
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, {
      prefix: "xion",
    });
    const [firstAccount] = await wallet.getAccounts();
    const serverAddress = firstAccount.address;

    // 3. Setup client
    const client = await SigningCosmWasmClient.connectWithSigner(rpcUrl, wallet, {
      gasPrice: GasPrice.fromString("0.001uxion"),
    });

    console.log("[XION SERVER SUBMIT]", {
      serverAddress,
      targetContract: contractAddress,
      originalSender,
      msgPreview: msg,
    });

    // 4. Execute
    const result = await client.execute(
      serverAddress,
      contractAddress,
      msg,
      "auto",
      `Vite Sync (Fallback) - Original Submitter: ${originalSender || 'unknown'}`
    );

    return NextResponse.json({
      transactionHash: result.transactionHash,
      height: result.height,
      gasUsed: result.gasUsed.toString(),
      serverSigner: serverAddress,
      mode: "server_testnet_fallback"
    });

  } catch (error: any) {
    console.error("[XION SERVER SUBMIT ERROR]", error);
    return NextResponse.json({ 
      error: error.message || "Internal server error during transaction",
      details: error.toString()
    }, { status: 500 });
  }
}
