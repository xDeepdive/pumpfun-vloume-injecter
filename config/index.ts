import { clusterApiUrl, Connection,Keypair, PublicKey } from "@solana/web3.js";
import bs58 from "bs58";


// export const wallet = Keypair.fromSecretKey(bs58.decode(""));

// export const feePayer = Keypair.fromSecretKey(bs58.decode(""));

export const RPC_URL = "https://api.mainet.solana.com";


export const connection = new Connection(clusterApiUrl("mainnet-beta"),"confirmed");
