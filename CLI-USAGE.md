# PumpFun Volume Bot - CLI Usage Guide

Comprehensive command-line interface with 15+ commands and 12 advanced features.

## Quick Start

### 1. Initial Setup
```bash
npm run bot -- setup
```

Interactive setup wizard:
- Configure RPC endpoints (Helius, Alchemy, QuickNode, etc.)
- Set up your main wallet (provide private key)
- Save configuration for future use

**You'll need:**
- RPC endpoint URLs with API keys
- Main wallet private key (base58 or JSON array format)
- Sufficient SOL for wallet funding

---

### 2. Create Trading Wallets
```bash
npm run bot -- distribute -n 5 -a 0.01
```

**Options:**
- `-n, --number <number>` - Number of wallets to create (default: 20)
- `-a, --amount <amount>` - SOL per wallet (default: 0.01)

**Examples:**
```bash
# Create 5 wallets with 0.01 SOL each
npm run bot -- distribute -n 5 -a 0.01

# Create 50 wallets with 0.02 SOL each
npm run bot -- distribute -n 50 -a 0.02
```

---

### 3. Check Wallet Balances
```bash
npm run bot -- balance
```

Shows:
- Balance of each trading wallet (color-coded)
- Total balance across all wallets
- Average balance per wallet

**Color coding:**
- 🔴 Red: < 0.001 SOL (critical - needs funding)
- 🟡 Yellow: < 0.01 SOL (low)
- 🟢 Green: ≥ 0.01 SOL (healthy)

---

## Main Commands

### Setup & Configuration

#### Setup
```bash
npm run bot -- setup
```
Configure RPC endpoints and main wallet.

#### Info
```bash
npm run bot -- info
```
Display current configuration, RPC endpoints, and wallet count.

---

### Wallet Management

#### Distribute
```bash
npm run bot -- distribute -n 10 -a 0.01
```
Create and fund trading wallets.

Options:
- `-n, --number <number>` - Number of wallets
- `-a, --amount <amount>` - SOL per wallet

#### Balance
```bash
npm run bot -- balance
```
Check all wallet balances with color coding.

#### Collect
```bash
npm run bot -- collect
```
Collect all SOL from trading wallets back to main wallet.

Leaves 0.001 SOL per wallet for rent exemption.

#### Wallets Generate
```bash
npm run bot -- wallets generate 5
```
Generate additional wallets without funding them.

#### Wallets Cleanup
```bash
npm run bot -- wallets cleanup
```
Remove wallets with zero balance.

---

### Volume Injection

#### Start (Basic)
```bash
npm run bot -- start -t YOUR_TOKEN_MINT
```

**Core Options:**
- `-t, --token <address>` - Token mint address
- `-i, --interval <ms>` - Execution interval (default: 500ms)
- `-s, --slippage <percent>` - Slippage tolerance (default: 10%)
- `--min <percent>` - Min trade percentage (default: 20%)
- `--max <percent>` - Max trade percentage (default: 90%)

**Advanced Options:**
- `--dry-run` - Simulate without sending real transactions
- `--auto-refund` - Auto-fund wallets when balance is low
- `--refund-threshold <sol>` - Threshold for auto-refund (default: 0.008)
- `--smart-slippage` - Auto-adjust slippage based on success rate
- `--target-success-rate <percent>` - Target success rate (default: 75%)
- `--target-volume <sol>` - Stop after reaching volume goal
- `--max-budget <sol>` - Stop after spending budget limit
- `-p, --profile <name>` - Use saved profile

**Examples:**
```bash
# Basic usage
npm run bot -- start -t YOUR_TOKEN

# Custom settings
npm run bot -- start -t YOUR_TOKEN -i 1000 -s 25

# With advanced features
npm run bot -- start -t YOUR_TOKEN \
  --smart-slippage \
  --auto-refund \
  --target-volume 1.0

# Dry run mode (test without sending real txs)
npm run bot -- start -t YOUR_TOKEN --dry-run

# Using saved profile
npm run bot -- start --profile mytoken
```

---

#### Start-Optimized (WITH GAS OPTIMIZATION)
```bash
npm run bot -- start-optimized -t YOUR_TOKEN
```

All `start` options PLUS gas optimization:

**Gas Options:**
- `--gas-level <level>` - Priority level: `low`, `medium`, `high`, `veryHigh`, `auto`
- `--max-gas-price <microLamports>` - Maximum gas price cap

**Examples:**
```bash
# Auto gas optimization (RECOMMENDED)
npm run bot -- start-optimized -t YOUR_TOKEN --gas-level auto

# Low priority (cheapest)
npm run bot -- start-optimized -t YOUR_TOKEN --gas-level low

# High priority (faster confirmation)
npm run bot -- start-optimized -t YOUR_TOKEN --gas-level high

# With max price cap
npm run bot -- start-optimized -t YOUR_TOKEN \
  --gas-level auto \
  --max-gas-price 50000

# Production mode (all features)
npm run bot -- start-optimized -t YOUR_TOKEN \
  --gas-level auto \
  --smart-slippage \
  --auto-refund \
  --target-volume 10.0 \
  --max-budget 0.5
```

**Stop the bot:** Press `Ctrl+C`

---

### Gas Optimization Commands

#### Gas Check
```bash
npm run bot -- gas check
```

Analyze network congestion:
- Network congestion level (low/medium/high/veryHigh)
- Current TPS (transactions per second)
- Average priority fee
- Fee statistics (min, max, avg, percentiles)
- Recommendations

#### Gas Estimate
```bash
npm run bot -- gas estimate
```

Estimate fees for all priority levels:
- LOW: Cheapest, slower
- MEDIUM: Balanced
- HIGH: Faster, more expensive
- VERY HIGH: Fastest, most expensive
- AUTO: Network-adaptive (recommended)

Shows estimated SOL cost per transaction.

#### Gas Compare
```bash
npm run bot -- gas compare
```

Compare potential savings between priority levels.

---

### Transaction History & Analytics

#### History
```bash
npm run bot -- history
```

View transaction history.

**Options:**
- `--limit <number>` - Number of transactions to show
- `--success-only` - Show only successful transactions
- `--failed-only` - Show only failed transactions
- `--token <address>` - Filter by token
- `--export <filename>` - Export to CSV

**Examples:**
```bash
# Last 50 transactions
npm run bot -- history --limit 50

# Only successful
npm run bot -- history --success-only

# Export to CSV
npm run bot -- history --export history.csv

# Filter by token
npm run bot -- history --token YOUR_TOKEN
```

#### Stats
```bash
npm run bot -- stats
```

Analytics dashboard:
- Total transactions
- Success rate
- Total volume
- Total fees
- Average transaction size
- Most active wallet
- Time period analysis

---

### Profile Management

#### Profile Save
```bash
npm run bot -- profile save <name> [options]
```

Save configuration for reuse.

**Example:**
```bash
npm run bot -- profile save mytoken \
  -t YOUR_TOKEN \
  -i 1000 \
  -s 25 \
  --auto-refund \
  --smart-slippage
```

#### Profile List
```bash
npm run bot -- profile list
```

Show all saved profiles.

#### Profile Show
```bash
npm run bot -- profile show <name>
```

Display profile details.

#### Profile Delete
```bash
npm run bot -- profile delete <name>
```

Remove a profile.

---

## Complete Command Reference

| Command | Description |
|---------|-------------|
| `setup` | Initial configuration |
| `distribute` | Create and fund wallets |
| `balance` | Check wallet balances |
| `start` | Start volume injection |
| `start-optimized` | Start with gas optimization |
| `collect` | Collect SOL back to main wallet |
| `info` | Show configuration |
| `history` | View transaction history |
| `stats` | Analytics dashboard |
| `profile save` | Save configuration |
| `profile list` | List all profiles |
| `profile show` | Show profile details |
| `profile delete` | Delete profile |
| `wallets generate` | Generate wallets |
| `wallets cleanup` | Remove empty wallets |
| `gas check` | Network congestion analysis |
| `gas estimate` | Fee estimation |
| `gas compare` | Compare fee savings |

---

## Complete Workflow Examples

### Conservative Mode (Safe & Steady)
```bash
# 1. Setup
npm run bot -- setup

# 2. Create wallets
npm run bot -- distribute -n 5 -a 0.01

# 3. Check balances
npm run bot -- balance

# 4. Test with dry-run
npm run bot -- start -t YOUR_TOKEN \
  -i 2000 \
  -s 30 \
  --min 20 \
  --max 50 \
  --dry-run

# 5. Start for real
npm run bot -- start -t YOUR_TOKEN \
  -i 2000 \
  -s 30 \
  --min 20 \
  --max 50
```

### Aggressive Mode (High Volume)
```bash
npm run bot -- start -t YOUR_TOKEN \
  -i 500 \
  -s 15 \
  --min 40 \
  --max 90 \
  --smart-slippage \
  --target-volume 5.0
```

### Production Mode (All Features + Gas Optimization)
```bash
npm run bot -- start-optimized -t YOUR_TOKEN \
  --gas-level auto \
  --smart-slippage \
  --auto-refund \
  --target-volume 10.0 \
  --max-budget 0.5
```

### Profile-Based Workflow
```bash
# Save profile once
npm run bot -- profile save mytoken \
  -t YOUR_TOKEN \
  -i 1000 \
  -s 25 \
  --auto-refund \
  --smart-slippage

# Use anytime
npm run bot -- start --profile mytoken

# Or with gas optimization
npm run bot -- start-optimized --profile mytoken --gas-level auto
```

---

## Configuration Files

```
.pumpfun-config/
├── config.json           # RPC endpoints and settings
└── main-wallet.json      # Main wallet private key (KEEP SECURE!)

keys/
└── data.json            # Trading wallet private keys (AUTO-GENERATED)

logs/
└── transactions.json    # Transaction history

.pumpfun-profiles/
└── *.json               # Saved profiles
```

**Security:** Never commit `.pumpfun-config/` or `keys/` to version control!

---

## Troubleshooting

### "No configuration found"
```bash
Solution: Run setup first
npm run bot -- setup
```

### "No wallets found"
```bash
Solution: Create wallets
npm run bot -- distribute -n 5 -a 0.01
```

### Low success rate (<50%)
```bash
Solution: Increase slippage and interval
npm run bot -- start -t TOKEN --smart-slippage -i 1500 -s 30
```

### High gas fees
```bash
Solution: Use gas optimization
npm run bot -- start-optimized -t TOKEN --gas-level low
```

### Wallets running low on SOL
```bash
Solution: Enable auto-refund
npm run bot -- start -t TOKEN --auto-refund
```

### Transaction simulation failed
```bash
Solutions:
1. Increase slippage: -s 25 or higher
2. Enable smart slippage: --smart-slippage
3. Check bonding curve is still active
4. Verify RPC endpoints are working
```

---

## Cost Estimation

### Per Transaction Cycle
- **Protocol fees**: ~2% of trade amount
- **Network fees**: ~0.000005 SOL (without gas optimization)
- **Gas fees**: 0.000001-0.080000 SOL (depends on priority level)

### With Gas Optimization
Using `--gas-level auto`:
- **Saves up to 87.5%** on gas fees vs default high priority
- Average gas fee: ~0.010000 SOL per tx
- 100 txs with auto: ~1.00 SOL in gas fees
- 100 txs without optimization: ~8.00 SOL

### Example Costs (500ms interval = 2 tx/sec)
```
7,200 transactions per hour

Without gas optimization:
  Protocol fees: ~2% of volume
  Gas fees: ~57.6 SOL/hour (at veryHigh priority)

With gas optimization (auto):
  Protocol fees: ~2% of volume
  Gas fees: ~7.2 SOL/hour (87.5% savings)
```

---

## Safety Tips

✅ **DO:**
- Test with `--dry-run` first
- Monitor balances with `npm run bot -- balance`
- Use gas optimization to save costs
- Enable `--smart-slippage` for better success rates
- Set `--max-budget` to control spending
- Check network first with `npm run bot -- gas check`
- Save profiles for different tokens
- Review transaction history regularly

❌ **DON'T:**
- Commit private keys to Git
- Run without sufficient balance
- Use very low intervals (<500ms) without testing
- Leave bot running unmonitored
- Skip dry-run testing for new configurations

---

## Getting Help

```bash
# General help
npm run bot -- --help

# Command-specific help
npm run bot -- start --help
npm run bot -- distribute --help
npm run bot -- gas --help
```

---

## Advanced Tips

### Maximize Success Rate
- Enable `--smart-slippage` (auto-adjusts based on results)
- Use slower intervals: `-i 1000` or higher
- Start with higher slippage: `-s 25` to `-s 30`
- Monitor with `npm run bot -- stats`

### Minimize Costs
- Use gas optimization: `start-optimized --gas-level auto`
- Check network before starting: `npm run bot -- gas check`
- Set max price cap: `--max-gas-price 50000`
- Use lower priority during off-peak hours: `--gas-level low`

### Prevent Wallet Depletion
- Enable `--auto-refund` feature
- Set appropriate threshold: `--refund-threshold 0.01`
- Monitor balances: `npm run bot -- balance`
- Collect funds when done: `npm run bot -- collect`

### Optimize Volume Generation
- Use target volume: `--target-volume 10.0`
- Enable wallet rotation (automatic in enhanced mode)
- Multiple wallets for better distribution
- Vary trade sizes with `--min` and `--max`

---

**⚠️ DISCLAIMER:**

This tool is for educational and authorized testing purposes only. Creating artificial trading volume may constitute market manipulation and could be illegal in many jurisdictions. Use only with proper authorization and in compliance with local laws. All blockchain transactions are permanent and publicly visible.
