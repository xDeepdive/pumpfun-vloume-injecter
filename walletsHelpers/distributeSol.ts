import {
  ComputeBudgetProgram,
  Connection,
  Keypair,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import bs58 from "bs58";
import { saveDataToFile } from "./saveAccounts";

const SWAP_AMOUNT = 0.01;

export const distributeSol = async (
  connection: Connection,
  mainKp: Keypair,
  distritbutionNum: number
) => {
  let kps: Keypair[] = [];

  try {
    const sendSolTx: TransactionInstruction[] = [];
    sendSolTx.push(
      ComputeBudgetProgram.setComputeUnitLimit({ units: 1_000_000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 250_000 })
    );
    const mainSolBal = await connection.getBalance(mainKp.publicKey);
    if (mainSolBal <= 4 * 10 ** 6) {
      console.log("Main wallet balance is not enough");
      return [];
    }
    let solAmount = Math.floor((SWAP_AMOUNT) * 10 ** 9);

    for (let i = 0; i < distritbutionNum; i++) {
      const wallet = Keypair.generate();
      kps.push(wallet);

      sendSolTx.push(
        SystemProgram.transfer({
          fromPubkey: mainKp.publicKey,
          toPubkey: wallet.publicKey,
          lamports: solAmount,
        })
      );
    }

    try {
      saveDataToFile(kps.map((kp) => bs58.encode(kp.secretKey)));
    } catch (error) {
      console.log("erro");
    }

    console.log("now sending the transaction!!");
    let index = 0;
    while (true) {
      console.log("loops start!!!");
      try {
        if (index > 5) {
          console.log("Error in distribution");
          return null;
        }
        const siTx = new Transaction().add(...sendSolTx);
        const latestBlockhash = await connection.getLatestBlockhash();
        siTx.feePayer = mainKp.publicKey;
        siTx.recentBlockhash = latestBlockhash.blockhash;
        const messageV0 = new TransactionMessage({
          payerKey: mainKp.publicKey,
          recentBlockhash: latestBlockhash.blockhash,
          instructions: sendSolTx,
        }).compileToV0Message();
        const transaction = new VersionedTransaction(messageV0);
        transaction.sign([mainKp]);

        console.log("exucutinggg the transaction!!");
        const signature = await connection.sendRawTransaction(
          transaction.serialize(),
          { skipPreflight: true }
        );
        console.log("transaction exucuted!!!!: -- ", signature);

        const confirmation = await connection.confirmTransaction({
          signature,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
          blockhash: latestBlockhash.blockhash,
        });

        console.log("transaction is confirmeddddd---- -- ", signature);

        if (!confirmation.value.err) {
          const distibuteTx = signature ? `https://solscan.io/tx/${signature}` : "";
          console.log("SOL distributed ", distibuteTx);
          break;
        }
        index++;
      } catch (error) {
        index++;
      }
    }
    console.log("Success in distribution");
    return kps;
  } catch (error) {
    console.log(`Failed to transfer SOL`, error);
    return null;
  }
};