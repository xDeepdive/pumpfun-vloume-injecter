# PumpFun Volume Bot - Complete Installation & Usage Guide

## 📦 What's Included

This zip contains a complete PumpFun volume injection bot with an easy-to-use CLI interface.

**File:** `pumpfun-bot.zip` (71 KB)

---

## 🔧 Prerequisites

Before you start, make sure you have:

1. **Node.js** (v16 or higher)
   - Check: `node --version`
   - Download: https://nodejs.org/

2. **npm** (comes with Node.js)
   - Check: `npm --version`

3. **Solana Wallet** with SOL
   - Minimum: 0.5 SOL for testing
   - Recommended: 1-2 SOL

4. **RPC API Keys**
   - Helius: https://www.helius.dev/ (free tier available)
   - Alchemy: https://www.alchemy.com/ (free tier available)

---

## 📥 Installation Steps

### Step 1: Extract the Zip File

```bash
# Extract to your desired location
unzip pumpfun-bot.zip
cd pumpfun-vloume-injecter
```

### Step 2: Install Dependencies

```bash
# Install all required packages
npm install
```

This will install:
- @solana/web3.js - Solana blockchain SDK
- @coral-xyz/anchor - Solana program framework
- commander - CLI framework
- inquirer - Interactive prompts
- chalk - Colored terminal output
- ora - Loading spinners
- And all other dependencies

**Installation time:** ~1-2 minutes

---

## 🚀 Quick Start (5 Minutes)

### 1. Configure the Bot

```bash
npm run bot setup
```

You'll be prompted for:

**RPC Endpoint 1 (Helius):**
```
https://mainnet.helius-rpc.com/?api-key=YOUR_HELIUS_API_KEY
```

**RPC Endpoint 2 (Alchemy):**
```
https://solana-mainnet.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY
```

**Main Wallet Private Key:**
- Enter as **base58** string, OR
- Enter as **JSON array** [123,45,67,...]

Example base58 format:
```
5KqZXPnMQ7V8xJWKqvR3p2Y1nN4T...
```

Example JSON array format:
```
[174,47,154,16,202,193,206,113,199,...]
```

✅ **Configuration saved to:** `.pumpfun-config/config.json`

---

### 2. Create Trading Wallets

```bash
# Create 20 wallets with 0.01 SOL each (default)
npm run bot distribute
```

**OR customize:**

```bash
# Create 50 wallets with 0.02 SOL each
npm run bot distribute -n 50 -a 0.02
```

**Requirements:**
- Your main wallet must have: (number_of_wallets × SOL_per_wallet) + 0.05 for fees
- Example: 20 wallets × 0.01 SOL = 0.2 SOL + 0.05 fees = **0.25 SOL minimum**

✅ **Wallets saved to:** `keys/data.json`

---

### 3. Verify Wallet Balances

```bash
npm run bot balance
```

**Output example:**
```
💰 Wallet Balances

Wallet 00: 0.010000 SOL - DYw8jCGf...
Wallet 01: 0.010000 SOL - 5Km9rXyP...
Wallet 02: 0.010000 SOL - 8pLm3nQa...
...

📊 Total balance: 0.200000 SOL
📊 Average per wallet: 0.010000 SOL
```

**Color coding:**
- 🟢 Green: ≥ 0.01 SOL (healthy)
- 🟡 Yellow: < 0.01 SOL (low)
- 🔴 Red: < 0.001 SOL (critical - needs refunding)

---

### 4. Start Volume Injection

```bash
# Interactive mode (will ask for token address)
npm run bot start
```

**OR provide token directly:**

```bash
npm run bot start -t YOUR_TOKEN_MINT_ADDRESS
```

**With custom parameters:**

```bash
npm run bot start \
  -t 6vTbDWJgfYEXLAxA1v46ZnKn3nwAcbVkcwshG5eYpump \
  -i 1000 \
  -s 15 \
  --min 30 \
  --max 80
```

**Parameters explained:**
- `-t` = Token mint address (required)
- `-i` = Interval in milliseconds (default: 500 = 0.5 seconds)
- `-s` = Slippage tolerance % (default: 10%)
- `--min` = Minimum trade % of wallet balance (default: 20%)
- `--max` = Maximum trade % of wallet balance (default: 90%)

**Stop the bot:**
```
Press Ctrl+C
```

---

## 📋 All Available Commands

### Main Commands
| Command | Description | Example |
|---------|-------------|---------|
| `npm run bot -- setup` | Configure RPC and wallet | First-time setup |
| `npm run bot -- distribute` | Create trading wallets | `-n 5 -a 0.01` |
| `npm run bot -- balance` | Check wallet balances | Show all balances |
| `npm run bot -- start` | Start volume bot (basic) | `-t TOKEN -i 1000` |
| `npm run bot -- start-optimized` | Start with gas optimization | `-t TOKEN --gas-level auto` |
| `npm run bot -- collect` | Collect SOL back to main wallet | Recover funds |
| `npm run bot -- info` | Show configuration | View current settings |

### Advanced Commands
| Command | Description | Example |
|---------|-------------|---------|
| `npm run bot -- history` | View transaction history | `--limit 50 --export` |
| `npm run bot -- stats` | Analytics dashboard | Show statistics |
| `npm run bot -- gas check` | Network congestion analysis | Check fees |
| `npm run bot -- gas estimate` | Fee estimation | All priority levels |
| `npm run bot -- profile save` | Save configuration | `mytoken -t TOKEN` |
| `npm run bot -- wallets generate` | Generate wallets | Generate 10 wallets |
| `npm run bot -- --help` | Show all commands | Get help |

---

## 🚀 Advanced Features (12 Features)

This bot includes 12 major advanced features:

### 1. Gas Optimization (NEW!)
Save up to 87.5% on transaction fees with priority fee optimization.

```bash
# Check network congestion
npm run bot -- gas check

# Estimate fees for different priority levels
npm run bot -- gas estimate

# Start with gas optimization (RECOMMENDED)
npm run bot -- start-optimized -t YOUR_TOKEN --gas-level auto
```

**Priority Levels:**
- `low` - Cheapest, slower confirmation
- `medium` - Balanced approach
- `high` - Faster, more expensive
- `veryHigh` - Fastest, most expensive
- `auto` - Network-adaptive (recommended)

### 2. Smart Slippage Adjustment
Automatically adjusts slippage based on success rate.

```bash
npm run bot -- start -t TOKEN --smart-slippage --target-success-rate 75
```

### 3. Auto-Refund System
Automatically refunds wallets when balance is low.

```bash
npm run bot -- start -t TOKEN --auto-refund --refund-threshold 0.008
```

### 4. Transaction Logging & Analytics
Complete transaction history with CSV export.

```bash
npm run bot -- history --limit 50
npm run bot -- history --export report.csv
npm run bot -- stats
```

### 5. Profile Management
Save and reuse configurations.

```bash
# Save profile
npm run bot -- profile save mytoken -t TOKEN -i 1000 -s 25

# Use profile
npm run bot -- start --profile mytoken
```

### 6. Dry Run Mode
Test without sending real transactions.

```bash
npm run bot -- start -t TOKEN --dry-run
```

### 7. Target Volume & Budget Control
Set goals and spending limits.

```bash
npm run bot -- start -t TOKEN \
  --target-volume 10.0 \
  --max-budget 0.5
```

### 8-12. Additional Features
- Multi-RPC Failover (automatic)
- Wallet Rotation Strategy (automatic)
- Advanced Wallet Management
- Health Monitoring
- Real-time Statistics Dashboard

**See [FEATURES.md](FEATURES.md) for complete documentation.**

---

## 🎯 Complete Usage Example

```bash
# 1. Setup (FIRST TIME ONLY)
npm run bot setup
# Enter your RPC endpoints and main wallet key

# 2. Verify your main wallet has enough SOL
# Need: (30 wallets × 0.01 SOL) + 0.05 = 0.35 SOL minimum

# 3. Create 30 trading wallets
npm run bot distribute -n 30

# 4. Check balances
npm run bot balance

# 5. Start volume injection
npm run bot start -t 6vTbDWJgfYEXLAxA1v46ZnKn3nwAcbVkcwshG5eYpump

# Output:
🚀 Starting Volume Bot

Token: 6vTbDWJgfYEXLAxA1v46ZnKn3nwAcbVkcwshG5eYpump
Interval: 500ms
Slippage: 10%
Trade range: 20% - 90%

Press Ctrl+C to stop
────────────────────────────────────────────────

[1] Using 45.23% of wallet balance: 0.0045 SOL
Bonding Curve PDA: HqN8x...
[1] Simulation result: SUCCESS
[1] Transaction sent: 3kYmZ7w8Qr...
[1] Execution completed in 983ms

[2] Using 67.89% of wallet balance: 0.0068 SOL
...

--- Stats after 10 executions ---
Success: 8, Errors: 2, Success rate: 80.00%

# 6. Stop with Ctrl+C when done
^C
Received SIGINT, shutting down gracefully...
Final stats: 87/100 successful executions
```

---

## 📂 Project Structure

```
pumpfun-vloume-injecter/
├── cli.ts                    # CLI interface (NEW!)
├── CLI-USAGE.md              # Detailed CLI documentation
├── README.md                 # Project overview
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript config
│
├── src/
│   ├── volume.ts             # Main volume injection logic
│   ├── pumpfunHelper.ts      # PumpFun protocol interface
│   ├── calculations.ts       # Bonding curve calculations
│   ├── types.ts              # TypeScript types
│   └── pda.ts                # Program Derived Addresses
│
├── executor/
│   ├── jito.ts               # Jito bundle execution
│   └── legacy.ts             # Standard transaction execution
│
├── walletsHelpers/
│   ├── distributeSol.ts      # Distribute SOL to wallets
│   ├── checkBalances.ts      # Check wallet balances
│   ├── saveAccounts.ts       # Save wallet keypairs
│   └── collect.ts            # Collect funds back
│
├── config/
│   └── index.ts              # RPC configuration (auto-updated by CLI)
│
├── IDL/
│   ├── pump.ts               # PumpFun program IDL
│   └── pump.json             # PumpFun program interface
│
├── .pumpfun-config/          # (Created by CLI - DO NOT COMMIT)
│   ├── config.json           # Your settings
│   └── main-wallet.json      # Main wallet private key
│
└── keys/                     # (Created by CLI - DO NOT COMMIT)
    └── data.json             # Trading wallet private keys
```

---

## 💰 Cost Estimation

### Per Transaction Cycle (Buy + Sell)
- Network fee: ~0.000005 SOL
- PumpFun buy fee: ~1% of trade amount
- PumpFun sell fee: ~1% of trade amount
- Gas fees (priority): Variable (see below)
- **Net loss per cycle: ~2% + gas fees**

### Gas Fees Comparison

**Without Gas Optimization:**
- Default priority (veryHigh): ~0.08 SOL per tx
- 100 transactions = ~8.00 SOL in gas fees

**With Gas Optimization (`--gas-level auto`):**
- Adaptive priority: ~0.01 SOL per tx
- 100 transactions = ~1.00 SOL in gas fees
- **SAVES 7.00 SOL (87.5%)**

### Example Costs

**Basic Mode (without gas optimization):**
- Protocol fees: ~2% of volume
- Gas fees: ~0.08 SOL per tx
- At 500ms interval: 7,200 txs/hour
- **Hourly gas cost: ~576 SOL**

**Optimized Mode (with `--gas-level auto`):**
- Protocol fees: ~2% of volume
- Gas fees: ~0.01 SOL per tx
- At 500ms interval: 7,200 txs/hour
- **Hourly gas cost: ~72 SOL (87.5% savings)**

**Recommendation:** ALWAYS use `start-optimized` to save on gas fees!

---

## ⚙️ Configuration Options

### Execution Speed

**Fast (High Volume):**
```bash
npm run bot start -t TOKEN -i 500  # Every 0.5 seconds
```

**Medium (Moderate Volume):**
```bash
npm run bot start -t TOKEN -i 1000  # Every 1 second
```

**Slow (Low Volume):**
```bash
npm run bot start -t TOKEN -i 2000  # Every 2 seconds
```

### Trade Size

**Small Trades (Conservative):**
```bash
npm run bot start -t TOKEN --min 10 --max 30
# Uses 10-30% of wallet balance
```

**Medium Trades (Balanced):**
```bash
npm run bot start -t TOKEN --min 20 --max 50
# Uses 20-50% of wallet balance
```

**Large Trades (Aggressive):**
```bash
npm run bot start -t TOKEN --min 50 --max 90
# Uses 50-90% of wallet balance
```

### Slippage

**Tight (Stable tokens):**
```bash
npm run bot start -t TOKEN -s 5  # 5% slippage
```

**Normal (Default):**
```bash
npm run bot start -t TOKEN -s 10  # 10% slippage
```

**Loose (Volatile tokens):**
```bash
npm run bot start -t TOKEN -s 20  # 20% slippage
```

---

## 🔍 Troubleshooting

### Problem: "No configuration found"
**Solution:**
```bash
npm run bot setup
```

### Problem: "No wallets found"
**Solution:**
```bash
npm run bot distribute
```

### Problem: "Insufficient balance"
**Cause:** Main wallet doesn't have enough SOL

**Solution:**
1. Check your main wallet address: `npm run bot info`
2. Send SOL to that address
3. Run distribute again: `npm run bot distribute`

### Problem: "Transaction simulation failed"
**Possible causes:**
- Slippage too tight
- Token bonding curve migrated to Raydium
- Insufficient liquidity

**Solutions:**
- Increase slippage: `npm run bot start -t TOKEN -s 20`
- Check if token is still on PumpFun
- Verify token mint address is correct

### Problem: Wallets running out of SOL
**Cause:** Fees are depleting wallets

**Solutions:**
- Reduce trade frequency: `-i 2000` (slower)
- Reduce trade size: `--min 10 --max 30` (smaller)
- Add more SOL: `npm run bot distribute -a 0.02` (more per wallet)

### Problem: Low success rate (<50%)
**Possible causes:**
- RPC endpoint issues
- Network congestion
- Token issues

**Solutions:**
- Check RPC endpoints are working
- Try different RPC providers
- Reduce execution speed
- Increase slippage

### Problem: "Cannot find module" errors
**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

---

## 🛡️ Security Best Practices

### ✅ DO:
- Keep private keys secure
- Use environment variables for sensitive data
- Test with small amounts first
- Monitor balances regularly
- Use strong RPC API keys
- Back up your wallet keys securely

### ❌ DON'T:
- Commit `.pumpfun-config/` to Git
- Commit `keys/` folder to Git
- Share your private keys
- Run without monitoring
- Use maximum settings without testing
- Leave bot running unattended for long periods

### .gitignore (Already included)
```
node_modules/
.pumpfun-config/
keys/
*.log
.env
```

---

## 📊 Monitoring

### Real-time Output

The bot shows detailed logs:
```
[15] Using 67.32% of wallet balance: 0.0067 SOL
Bonding Curve PDA: HqN8x...
[15] Simulation result: SUCCESS
[15] Transaction sent: 3kYmZ7w8Qr...
[15] Execution completed in 1250ms
```

### Statistics

Every 10 executions:
```
--- Stats after 10 executions ---
Success: 8, Errors: 2, Success rate: 80.00%
```

### Check Transactions

Visit Solscan with the transaction signature:
```
https://solscan.io/tx/YOUR_SIGNATURE
```

---

## ⚠️ Important Warnings

### Legal Disclaimer

This tool creates **artificial trading volume** which may:
- ❌ Constitute market manipulation (illegal in most jurisdictions)
- ❌ Violate securities laws
- ❌ Breach exchange terms of service
- ❌ Result in criminal charges
- ❌ Cause civil liability

### Authorized Use Only

Use **ONLY** for:
- ✅ Authorized penetration testing
- ✅ Educational purposes with test tokens
- ✅ Research in controlled environments
- ✅ With explicit written authorization
- ✅ On devnet/testnet

### Financial Risk

- 💸 You WILL lose money to fees (~2% per cycle)
- 💸 Failed transactions waste fees
- 💸 No guarantee of success
- 💸 All blockchain transactions are permanent and public

---

## 📞 Getting Help

### View Documentation
```bash
# CLI usage guide
cat CLI-USAGE.md

# Project overview
cat README.md

# This installation guide
cat INSTALLATION-GUIDE.md
```

### Command Help
```bash
# General help
npm run bot -- --help

# Specific command help
npm run bot start --help
npm run bot distribute --help
```

### Check Configuration
```bash
# View current settings
npm run bot info
```

---

## 🔄 Updating the Bot

If you receive an updated version:

```bash
# 1. Back up your configuration
cp -r .pumpfun-config .pumpfun-config.backup
cp -r keys keys.backup

# 2. Extract new version
unzip pumpfun-bot-v2.zip

# 3. Reinstall dependencies
npm install

# 4. Restore configuration
cp -r .pumpfun-config.backup .pumpfun-config
cp -r keys.backup keys
```

---

## 📝 Quick Reference Card

### Essential Commands
```bash
npm run bot setup          # First-time configuration
npm run bot distribute     # Create wallets
npm run bot balance        # Check balances
npm run bot start          # Start bot
npm run bot info           # View settings
```

### Common Workflows

**First Time:**
```bash
npm install
npm run bot setup
npm run bot distribute
npm run bot start
```

**Daily Use:**
```bash
npm run bot balance        # Check balances
npm run bot start -t TOKEN # Start
```

**Refund Wallets:**
```bash
npm run bot distribute -n 20 -a 0.02
```

---

## ✅ Checklist

Before starting, make sure:

- [ ] Node.js v16+ installed
- [ ] npm installed
- [ ] RPC API keys obtained
- [ ] Main wallet has sufficient SOL
- [ ] Ran `npm install`
- [ ] Ran `npm run bot setup`
- [ ] Ran `npm run bot distribute`
- [ ] Verified balances with `npm run bot balance`
- [ ] Have target token mint address
- [ ] Understand the legal risks
- [ ] Understand the financial risks

---

## 🎓 Need More Help?

1. **CLI Usage Guide:** See `CLI-USAGE.md` for detailed command reference
2. **Project README:** See `README.md` for architecture overview
3. **Code Documentation:** Code is well-commented, check source files

---

**Good luck, and remember to use responsibly!** 🚀

All blockchain transactions are permanent and publicly visible on the Solana blockchain.
