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
import { logger } from './src/logger';
import { profileManager, TokenProfile } from './src/profiles';

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
  .option('--dry-run', 'Simulate without sending real transactions')
  .option('--auto-refund', 'Automatically refund wallets when low')
  .option('--refund-threshold <sol>', 'Balance threshold for auto-refund', '0.008')
  .option('--target-volume <sol>', 'Stop after reaching target volume')
  .option('--max-budget <sol>', 'Stop after spending max budget in fees')
  .option('--smart-slippage', 'Automatically adjust slippage for better success rate')
  .option('--target-success-rate <percent>', 'Target success rate for smart slippage', '75')
  .option('-p, --profile <name>', 'Use saved profile')
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
      shell: true,
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

// Collect Command
program
  .command('collect')
  .description('Collect all SOL from trading wallets back to main wallet')
  .action(async () => {
    showHeader();
    console.log(chalk.yellow('💰 Collect Funds\n'));

    const config = loadConfig();
    if (!config) {
      console.log(chalk.red('❌ No configuration found. Run "npm run bot setup" first.\n'));
      return;
    }

    if (!fs.existsSync(MAIN_WALLET_FILE)) {
      console.log(chalk.red('❌ Main wallet not found. Run "npm run bot setup" first.\n'));
      return;
    }

    const keysPath = path.join(process.cwd(), 'keys', 'data.json');
    if (!fs.existsSync(keysPath)) {
      console.log(chalk.red('❌ No trading wallets found. Run "npm run bot distribute" first.\n'));
      return;
    }

    const wallets = JSON.parse(fs.readFileSync(keysPath, 'utf-8'));
    console.log(chalk.white(`Found ${wallets.length} trading wallets\n`));

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Collect all funds from trading wallets to main wallet?',
        default: true,
      },
    ]);

    if (!confirm) {
      console.log(chalk.yellow('Cancelled.\n'));
      return;
    }

    console.log(chalk.cyan('\nStarting collection...\n'));

    // Run the collect script
    const { spawn } = await import('child_process');
    const collectProcess = spawn('npx', ['ts-node', 'collect-funds.ts'], {
      stdio: 'inherit',
      shell: true,
    });

    collectProcess.on('close', (code) => {
      if (code === 0) {
        console.log(chalk.green('\n✅ Collection completed successfully!\n'));
      } else {
        console.log(chalk.red(`\n❌ Collection failed with code ${code}\n`));
      }
    });
  });

// History Command
program
  .command('history')
  .description('View transaction history')
  .option('-l, --limit <number>', 'Number of transactions to show', '50')
  .option('-w, --wallet <address>', 'Filter by wallet address')
  .option('-t, --token <address>', 'Filter by token mint')
  .option('--success', 'Show only successful transactions')
  .option('--failed', 'Show only failed transactions')
  .option('--export <filename>', 'Export to CSV file')
  .action(async (options) => {
    showHeader();
    console.log(chalk.yellow('📜 Transaction History\n'));

    const filter: any = {
      limit: parseInt(options.limit)
    };

    if (options.wallet) filter.wallet = options.wallet;
    if (options.token) filter.tokenMint = options.token;
    if (options.success) filter.success = true;
    if (options.failed) filter.success = false;

    const logs = logger.getLogs(filter);

    if (logs.length === 0) {
      console.log(chalk.gray('No transactions found.\n'));
      return;
    }

    console.log(chalk.white(`Showing ${logs.length} transactions:\n`));

    logs.forEach((log, i) => {
      const statusIcon = log.success ? chalk.green('✓') : chalk.red('✗');
      const date = new Date(log.date).toLocaleString();
      console.log(`${statusIcon} [${i + 1}] ${date}`);
      console.log(`   Wallet: ${chalk.cyan(log.wallet.slice(0, 8))}...`);
      console.log(`   Amount: ${chalk.yellow(log.amount.toFixed(6))} SOL`);
      console.log(`   Fee: ${chalk.red(log.fee.toFixed(6))} SOL`);
      if (log.signature) {
        console.log(`   Tx: ${chalk.gray(log.signature)}`);
      }
      if (log.error) {
        console.log(`   Error: ${chalk.red(log.error)}`);
      }
      console.log();
    });

    if (options.export) {
      const filename = logger.exportToCSV(options.export, filter);
      console.log(chalk.green(`✅ Exported to ${filename}\n`));
    }
  });

// Stats Command
program
  .command('stats')
  .description('Show statistics and analytics')
  .option('-t, --token <address>', 'Filter by token mint')
  .option('--days <number>', 'Show stats for last N days')
  .action(async (options) => {
    showHeader();
    console.log(chalk.yellow('📊 Statistics & Analytics\n'));

    const filter: any = {};
    if (options.token) filter.tokenMint = options.token;
    if (options.days) {
      const days = parseInt(options.days);
      filter.startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    }

    const stats = logger.getStats(filter);

    console.log(chalk.white('Overall Statistics:'));
    console.log(chalk.cyan(`  Total Transactions: ${stats.total}`));
    console.log(chalk.green(`  Successful: ${stats.successful}`));
    console.log(chalk.red(`  Failed: ${stats.failed}`));
    console.log(chalk.yellow(`  Success Rate: ${stats.successRate.toFixed(2)}%`));
    console.log();

    console.log(chalk.white('Volume & Fees:'));
    console.log(chalk.cyan(`  Total Volume: ${stats.totalVolume.toFixed(6)} SOL`));
    console.log(chalk.red(`  Total Fees Paid: ${stats.totalFees.toFixed(6)} SOL`));
    console.log(chalk.yellow(`  Avg Fee per Tx: ${stats.avgFeePerTx.toFixed(6)} SOL`));
    console.log();

    console.log(chalk.white('Performance:'));
    console.log(chalk.cyan(`  Avg Execution Time: ${stats.avgExecutionTime.toFixed(0)}ms`));
    console.log();

    if (stats.totalVolume > 0) {
      const costPercentage = (stats.totalFees / stats.totalVolume) * 100;
      console.log(chalk.white('Efficiency:'));
      console.log(chalk.yellow(`  Cost as % of Volume: ${costPercentage.toFixed(2)}%`));
      console.log();
    }
  });

// Profile Commands
const profileCmd = program
  .command('profile')
  .description('Manage token profiles');

profileCmd
  .command('save <name>')
  .description('Save current configuration as a profile')
  .option('-t, --token <address>', 'Token mint address (required)')
  .option('-i, --interval <ms>', 'Execution interval', '500')
  .option('-s, --slippage <percent>', 'Slippage tolerance', '10')
  .option('--min <percent>', 'Minimum trade percentage', '20')
  .option('--max <percent>', 'Maximum trade percentage', '90')
  .option('--auto-refund', 'Enable auto-refund')
  .option('--refund-threshold <sol>', 'Refund threshold', '0.008')
  .option('--target-volume <sol>', 'Target volume')
  .option('--max-budget <sol>', 'Max budget')
  .option('--smart-slippage', 'Enable smart slippage')
  .option('--target-success-rate <percent>', 'Target success rate', '75')
  .action((name, options) => {
    if (!options.token) {
      console.log(chalk.red('❌ Token address is required.\n'));
      return;
    }

    const profile: TokenProfile = {
      name,
      tokenMint: options.token,
      interval: parseInt(options.interval),
      slippage: parseFloat(options.slippage),
      minPercent: parseFloat(options.min),
      maxPercent: parseFloat(options.max),
      autoRefund: options.autoRefund || false,
      refundThreshold: parseFloat(options.refundThreshold),
      targetVolume: options.targetVolume ? parseFloat(options.targetVolume) : undefined,
      maxBudget: options.maxBudget ? parseFloat(options.maxBudget) : undefined,
      smartSlippage: options.smartSlippage || false,
      targetSuccessRate: options.targetSuccessRate ? parseFloat(options.targetSuccessRate) : undefined,
      createdAt: new Date().toISOString(),
    };

    profileManager.save(profile);
    console.log(chalk.green(`✅ Profile '${name}' saved successfully!\n`));
  });

profileCmd
  .command('list')
  .description('List all saved profiles')
  .action(() => {
    const profiles = profileManager.list();

    if (profiles.length === 0) {
      console.log(chalk.gray('No profiles found.\n'));
      return;
    }

    console.log(chalk.yellow(`\n📋 Saved Profiles (${profiles.length}):\n`));

    profiles.forEach((profile, i) => {
      console.log(chalk.cyan(`${i + 1}. ${profile.name}`));
      console.log(`   Token: ${chalk.gray(profile.tokenMint)}`);
      console.log(`   Interval: ${profile.interval}ms, Slippage: ${profile.slippage}%`);
      console.log(`   Range: ${profile.minPercent}%-${profile.maxPercent}%`);
      if (profile.autoRefund) {
        console.log(`   Auto-refund: ${chalk.green('Enabled')} (threshold: ${profile.refundThreshold} SOL)`);
      }
      if (profile.smartSlippage) {
        console.log(`   Smart slippage: ${chalk.green('Enabled')}`);
      }
      if (profile.lastUsed) {
        console.log(`   Last used: ${chalk.gray(new Date(profile.lastUsed).toLocaleString())}`);
      }
      console.log();
    });
  });

profileCmd
  .command('delete <name>')
  .description('Delete a saved profile')
  .action((name) => {
    if (profileManager.delete(name)) {
      console.log(chalk.green(`✅ Profile '${name}' deleted.\n`));
    } else {
      console.log(chalk.red(`❌ Profile '${name}' not found.\n`));
    }
  });

profileCmd
  .command('show <name>')
  .description('Show profile details')
  .action((name) => {
    const profile = profileManager.get(name);

    if (!profile) {
      console.log(chalk.red(`❌ Profile '${name}' not found.\n`));
      return;
    }

    console.log(chalk.yellow(`\n📋 Profile: ${chalk.cyan(profile.name)}\n`));
    console.log(chalk.white('Configuration:'));
    console.log(`  Token: ${chalk.cyan(profile.tokenMint)}`);
    console.log(`  Interval: ${chalk.yellow(profile.interval)}ms`);
    console.log(`  Slippage: ${chalk.yellow(profile.slippage)}%`);
    console.log(`  Trade Range: ${chalk.yellow(profile.minPercent)}%-${chalk.yellow(profile.maxPercent)}%`);
    console.log();

    console.log(chalk.white('Features:'));
    console.log(`  Auto-refund: ${profile.autoRefund ? chalk.green('✓') : chalk.gray('✗')}`);
    if (profile.autoRefund) {
      console.log(`    Threshold: ${profile.refundThreshold} SOL`);
    }
    console.log(`  Smart Slippage: ${profile.smartSlippage ? chalk.green('✓') : chalk.gray('✗')}`);
    if (profile.smartSlippage && profile.targetSuccessRate) {
      console.log(`    Target Success Rate: ${profile.targetSuccessRate}%`);
    }
    if (profile.targetVolume) {
      console.log(`  Target Volume: ${chalk.cyan(profile.targetVolume)} SOL`);
    }
    if (profile.maxBudget) {
      console.log(`  Max Budget: ${chalk.red(profile.maxBudget)} SOL`);
    }
    console.log();

    console.log(chalk.white('Metadata:'));
    console.log(`  Created: ${new Date(profile.createdAt).toLocaleString()}`);
    if (profile.lastUsed) {
      console.log(`  Last Used: ${new Date(profile.lastUsed).toLocaleString()}`);
    }
    console.log();
  });

// Wallets Command
const walletsCmd = program
  .command('wallets')
  .description('Advanced wallet management');

walletsCmd
  .command('generate <number>')
  .description('Generate wallet keypairs without funding')
  .action((number) => {
    const n = parseInt(number);
    const wallets = [];

    for (let i = 0; i < n; i++) {
      const wallet = Keypair.generate();
      wallets.push(bs58.encode(wallet.secretKey));
    }

    const keysDir = path.join(process.cwd(), 'keys');
    if (!fs.existsSync(keysDir)) {
      fs.mkdirSync(keysDir, { recursive: true });
    }

    const keysFile = path.join(keysDir, 'data.json');
    let existing = [];
    if (fs.existsSync(keysFile)) {
      existing = JSON.parse(fs.readFileSync(keysFile, 'utf-8'));
    }

    existing.push(...wallets);
    fs.writeFileSync(keysFile, JSON.stringify(existing, null, 2));

    console.log(chalk.green(`✅ Generated ${n} wallets (unfunded)\n`));
    console.log(chalk.yellow(`💡 Use "npm run bot -- distribute" to fund them.\n`));
  });

walletsCmd
  .command('cleanup')
  .description('Remove wallets with zero balance')
  .action(async () => {
    const config = loadConfig();
    if (!config) {
      console.log(chalk.red('❌ No configuration found.\n'));
      return;
    }

    const keysPath = path.join(process.cwd(), 'keys', 'data.json');
    if (!fs.existsSync(keysPath)) {
      console.log(chalk.red('❌ No wallets found.\n'));
      return;
    }

    const connection = new Connection(config.rpcs[0], 'confirmed');
    const walletKeys = JSON.parse(fs.readFileSync(keysPath, 'utf-8'));

    console.log(chalk.yellow('🔍 Checking wallet balances...\n'));

    const activeWallets = [];
    let removedCount = 0;

    for (const key of walletKeys) {
      const keypair = Keypair.fromSecretKey(bs58.decode(key));
      const balance = await connection.getBalance(keypair.publicKey);

      if (balance > 0) {
        activeWallets.push(key);
      } else {
        removedCount++;
        console.log(chalk.gray(`Removing: ${keypair.publicKey.toBase58().slice(0, 8)}... (0 SOL)`));
      }
    }

    fs.writeFileSync(keysPath, JSON.stringify(activeWallets, null, 2));

    console.log(chalk.green(`\n✅ Cleanup complete!`));
    console.log(chalk.cyan(`   Kept: ${activeWallets.length} wallets`));
    console.log(chalk.red(`   Removed: ${removedCount} wallets\n`));
  });

program.parse();
