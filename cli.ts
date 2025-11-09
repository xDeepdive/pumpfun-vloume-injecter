#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import fs from 'fs';
import path from 'path';
import { distributeSol } from './walletsHelpers/distributeSol';
import { fetchAllWalletBalance } from './walletsHelpers/checkBalances';
import bs58 from 'bs58';

const program = new Command();

// Config file paths
const CONFIG_DIR = path.join(process.cwd(), '.pumpfun-config');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const MAIN_WALLET_FILE = path.join(CONFIG_DIR, 'main-wallet.json');

// Ensure config directory exists
if (!fs.existsSync(CONFIG_DIR)) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
}

// Load configuration
function loadConfig() {
  if (fs.existsSync(CONFIG_FILE)) {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
  }
  return null;
}

// Save configuration
function saveConfig(config: any) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

// CLI Header
function showHeader() {
  console.log(chalk.cyan.bold('\n╔═══════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('║   PumpFun Volume Bot - CLI Interface        ║'));
  console.log(chalk.cyan.bold('╚═══════════════════════════════════════════════╝\n'));
}

program
  .name('pumpfun-bot')
  .description('PumpFun Volume Injection Bot - CLI Interface')
  .version('1.0.0');

// Setup Command
program
  .command('setup')
  .description('Configure RPC endpoints and main wallet')
  .action(async () => {
    showHeader();
    console.log(chalk.yellow('🔧 Configuration Setup\n'));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'rpc1',
        message: 'Enter Helius RPC endpoint (with API key):',
        default: 'https://mainnet.helius-rpc.com/?api-key=YOUR_KEY',
      },
      {
        type: 'input',
        name: 'rpc2',
        message: 'Enter Alchemy RPC endpoint (with API key):',
        default: 'https://solana-mainnet.g.alchemy.com/v2/YOUR_KEY',
      },
      {
        type: 'input',
        name: 'rpc3',
        message: 'Enter additional RPC endpoint (optional):',
        default: '',
      },
      {
        type: 'input',
        name: 'walletInput',
        message: 'Enter main wallet private key (base58 or JSON array):',
        validate: (input) => {
          if (!input) return 'Private key is required';
          return true;
        },
      },
    ]);

    const spinner = ora('Saving configuration...').start();

    try {
      // Parse wallet
      let keypair: Keypair;
      try {
        // Try base58 first
        const decoded = bs58.decode(answers.walletInput.trim());
        keypair = Keypair.fromSecretKey(decoded);
      } catch {
        try {
          // Try JSON array
          const keyArray = JSON.parse(answers.walletInput.trim());
          keypair = Keypair.fromSecretKey(new Uint8Array(keyArray));
        } catch {
          spinner.fail('Invalid private key format');
          return;
        }
      }

      // Save wallet
      fs.writeFileSync(
        MAIN_WALLET_FILE,
        JSON.stringify(Array.from(keypair.secretKey))
      );

      // Save RPC endpoints
      const rpcs = [answers.rpc1, answers.rpc2];
      if (answers.rpc3) rpcs.push(answers.rpc3);

      const config = {
        rpcs,
        mainWallet: keypair.publicKey.toBase58(),
      };

      saveConfig(config);

      // Update config/index.ts
      const configContent = `import { clusterApiUrl, Connection } from "@solana/web3.js"

export const RPCS_ENDPOINTS = [
${rpcs.map((rpc) => `    "${rpc}",`).join('\n')}
]

export const connection = new Connection(RPCS_ENDPOINTS[0],"confirmed");
`;

      fs.writeFileSync(
        path.join(process.cwd(), 'config', 'index.ts'),
        configContent
      );

      spinner.succeed('Configuration saved successfully!');
      console.log(chalk.green(`\n✅ Main wallet: ${keypair.publicKey.toBase58()}`));
      console.log(chalk.green(`✅ RPC endpoints: ${rpcs.length} configured`));
      console.log(chalk.yellow('\n💡 Next step: Run "npm run bot distribute" to create trading wallets\n'));
    } catch (error) {
      spinner.fail(`Configuration failed: ${error}`);
    }
  });

// Distribute Command
program
  .command('distribute')
  .description('Distribute SOL to multiple trading wallets')
  .option('-n, --number <number>', 'Number of wallets to create', '20')
  .option('-a, --amount <amount>', 'SOL amount per wallet', '0.01')
  .action(async (options) => {
    showHeader();

    const config = loadConfig();
    if (!config) {
      console.log(chalk.red('❌ No configuration found. Run "npm run bot setup" first.\n'));
      return;
    }

    if (!fs.existsSync(MAIN_WALLET_FILE)) {
      console.log(chalk.red('❌ Main wallet not found. Run "npm run bot setup" first.\n'));
      return;
    }

    const numWallets = parseInt(options.number);
    const amountPerWallet = parseFloat(options.amount);

    console.log(chalk.yellow('💸 Wallet Distribution\n'));
    console.log(chalk.white(`Wallets to create: ${numWallets}`));
    console.log(chalk.white(`Amount per wallet: ${amountPerWallet} SOL`));
    console.log(chalk.white(`Total SOL needed: ~${(numWallets * amountPerWallet + 0.05).toFixed(3)} SOL\n`));

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Proceed with distribution?',
        default: true,
      },
    ]);

    if (!confirm) {
      console.log(chalk.yellow('Cancelled.\n'));
      return;
    }

    const spinner = ora('Loading main wallet...').start();

    try {
      const mainWalletKey = JSON.parse(fs.readFileSync(MAIN_WALLET_FILE, 'utf-8'));
      const mainKeypair = Keypair.fromSecretKey(new Uint8Array(mainWalletKey));

      const connection = new Connection(config.rpcs[0], 'confirmed');

      spinner.text = 'Checking main wallet balance...';
      const balance = await connection.getBalance(mainKeypair.publicKey);
      const balanceSOL = balance / LAMPORTS_PER_SOL;

      if (balanceSOL < numWallets * amountPerWallet + 0.05) {
        spinner.fail(`Insufficient balance: ${balanceSOL.toFixed(4)} SOL`);
        console.log(chalk.red(`Need at least ${(numWallets * amountPerWallet + 0.05).toFixed(3)} SOL\n`));
        return;
      }

      spinner.succeed(`Main wallet balance: ${balanceSOL.toFixed(4)} SOL`);
      spinner.start('Distributing SOL to wallets...');

      const wallets = await distributeSol(connection, mainKeypair, numWallets);

      if (wallets) {
        spinner.succeed(`Successfully created ${wallets.length} wallets!`);
        console.log(chalk.green(`\n✅ Wallets saved to: keys/data.json`));
        console.log(chalk.yellow(`💡 Next step: Run "npm run bot balance" to verify balances\n`));
      } else {
        spinner.fail('Distribution failed');
      }
    } catch (error) {
      spinner.fail(`Error: ${error}`);
    }
  });

// Balance Command
program
  .command('balance')
  .description('Check all wallet balances')
  .action(async () => {
    showHeader();
    console.log(chalk.yellow('💰 Wallet Balances\n'));

    const config = loadConfig();
    if (!config) {
      console.log(chalk.red('❌ No configuration found. Run "npm run bot setup" first.\n'));
      return;
    }

    const keysPath = path.join(process.cwd(), 'keys', 'data.json');
    if (!fs.existsSync(keysPath)) {
      console.log(chalk.red('❌ No wallets found. Run "npm run bot distribute" first.\n'));
      return;
    }

    const spinner = ora('Fetching wallet balances...').start();

    try {
      const connection = new Connection(config.rpcs[0], 'confirmed');
      const wallets = JSON.parse(fs.readFileSync(keysPath, 'utf-8'));

      spinner.succeed(`Found ${wallets.length} wallets\n`);

      let totalBalance = 0;
      for (let i = 0; i < wallets.length; i++) {
        const keypair = Keypair.fromSecretKey(bs58.decode(wallets[i]));
        const balance = await connection.getBalance(keypair.publicKey);
        const balanceSOL = balance / LAMPORTS_PER_SOL;
        totalBalance += balanceSOL;

        const color = balanceSOL < 0.001 ? chalk.red : balanceSOL < 0.01 ? chalk.yellow : chalk.green;
        console.log(
          `${chalk.gray(`Wallet ${i.toString().padStart(2, '0')}`)}: ${color(balanceSOL.toFixed(6))} SOL - ${chalk.gray(keypair.publicKey.toBase58().slice(0, 8) + '...')}`
        );
      }

      console.log(chalk.cyan(`\n📊 Total balance: ${totalBalance.toFixed(6)} SOL`));
      console.log(chalk.cyan(`📊 Average per wallet: ${(totalBalance / wallets.length).toFixed(6)} SOL\n`));
    } catch (error) {
      spinner.fail(`Error: ${error}`);
    }
  });

// Start Command
program
  .command('start')
  .description('Start the volume injection bot')
  .option('-t, --token <address>', 'Token mint address')
  .option('-i, --interval <ms>', 'Execution interval in milliseconds', '500')
  .option('-s, --slippage <percent>', 'Slippage tolerance (1-100)', '10')
  .option('--min <percent>', 'Minimum trade percentage', '20')
  .option('--max <percent>', 'Maximum trade percentage', '90')
  .action(async (options) => {
    showHeader();

    const config = loadConfig();
    if (!config) {
      console.log(chalk.red('❌ No configuration found. Run "npm run bot setup" first.\n'));
      return;
    }

    const keysPath = path.join(process.cwd(), 'keys', 'data.json');
    if (!fs.existsSync(keysPath)) {
      console.log(chalk.red('❌ No wallets found. Run "npm run bot distribute" first.\n'));
      return;
    }

    let tokenMint = options.token;

    if (!tokenMint) {
      const answer = await inquirer.prompt([
        {
          type: 'input',
          name: 'token',
          message: 'Enter token mint address:',
          validate: (input) => {
            try {
              new PublicKey(input);
              return true;
            } catch {
              return 'Invalid public key';
            }
          },
        },
      ]);
      tokenMint = answer.token;
    }

    console.log(chalk.yellow('\n🚀 Starting Volume Bot\n'));
    console.log(chalk.white(`Token: ${tokenMint}`));
    console.log(chalk.white(`Interval: ${options.interval}ms`));
    console.log(chalk.white(`Slippage: ${options.slippage}%`));
    console.log(chalk.white(`Trade range: ${options.min}% - ${options.max}%\n`));

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: chalk.yellow('⚠️  This will start injecting volume. Continue?'),
        default: false,
      },
    ]);

    if (!confirm) {
      console.log(chalk.yellow('Cancelled.\n'));
      return;
    }

    // Update volume.ts with parameters
    const volumePath = path.join(process.cwd(), 'src', 'volume.ts');
    let volumeContent = fs.readFileSync(volumePath, 'utf-8');

    // Replace token mint
    volumeContent = volumeContent.replace(
      /const mint = new PublicKey\(".*?"\);/,
      `const mint = new PublicKey("${tokenMint}");`
    );

    // Replace interval
    volumeContent = volumeContent.replace(
      /}, \d+\);/,
      `}, ${options.interval});`
    );

    // Replace slippage
    volumeContent = volumeContent.replace(
      /slippage:\s*\d+/g,
      `slippage: ${options.slippage * 10}`
    );

    // Replace percentage range
    volumeContent = volumeContent.replace(
      /Math\.random\(\) \* \((\d+) - (\d+)\) \+ (\d+)/,
      `Math.random() * (${options.max} - ${options.min}) + ${options.min}`
    );

    fs.writeFileSync(volumePath, volumeContent);

    console.log(chalk.green('✅ Configuration updated\n'));
    console.log(chalk.cyan('Starting bot...\n'));
    console.log(chalk.gray('Press Ctrl+C to stop\n'));
    console.log(chalk.gray('─'.repeat(60)) + '\n');

    // Dynamic import and run
    const { spawn } = await import('child_process');
    const botProcess = spawn('npx', ['ts-node', 'src/volume.ts'], {
      stdio: 'inherit',
    });

    botProcess.on('close', (code) => {
      console.log(chalk.yellow(`\n\nBot stopped with code ${code}\n`));
    });
  });

// Info Command
program
  .command('info')
  .description('Show current configuration')
  .action(() => {
    showHeader();
    console.log(chalk.yellow('ℹ️  Configuration Information\n'));

    const config = loadConfig();
    if (!config) {
      console.log(chalk.red('❌ No configuration found. Run "npm run bot setup" first.\n'));
      return;
    }

    console.log(chalk.white('RPC Endpoints:'));
    config.rpcs.forEach((rpc: string, i: number) => {
      console.log(chalk.gray(`  ${i + 1}. ${rpc}`));
    });

    console.log(chalk.white(`\nMain Wallet: ${chalk.cyan(config.mainWallet)}`));

    const keysPath = path.join(process.cwd(), 'keys', 'data.json');
    if (fs.existsSync(keysPath)) {
      const wallets = JSON.parse(fs.readFileSync(keysPath, 'utf-8'));
      console.log(chalk.white(`Trading Wallets: ${chalk.cyan(wallets.length)} wallets\n`));
    } else {
      console.log(chalk.yellow(`\nTrading Wallets: ${chalk.gray('None created yet')}\n`));
    }
  });

program.parse();
