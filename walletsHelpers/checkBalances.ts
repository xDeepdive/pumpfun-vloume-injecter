import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import wallets from "../keys/data.json";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";


export const fetchAllWalletBalance = async(connection:Connection) => {

    for(let i = 0; i< wallets.length; i++){
        const keypair = Keypair.fromSecretKey(bs58.decode(wallets[i]));
        const balance = await connection.getBalance(keypair.publicKey);
        console.log(`wallet ${i} balance ---: ${balance/LAMPORTS_PER_SOL}`);
    }
}








