# 🚀 Advanced Features Guide

## ✅ **11 Major Features Implemented**

All features are **production-ready** and fully integrated into the CLI!

---

## 📋 **Table of Contents**

1. [Transaction History & Logging](#1-transaction-history--logging)
2. [Dry Run / Simulation Mode](#2-dry-run--simulation-mode)
3. [Statistics & Analytics Dashboard](#3-statistics--analytics-dashboard)
4. [Smart Slippage Adjustment](#4-smart-slippage-adjustment)
5. [Auto-Refund System](#5-auto-refund-system)
6. [Target Volume & Budget Control](#6-target-volume--budget-control)
7. [Token Profile Management](#7-token-profile-management)
8. [Multi-RPC Failover](#8-multi-rpc-failover)
9. [Advanced Wallet Management](#9-advanced-wallet-management)
10. [Wallet Rotation Strategy](#10-wallet-rotation-strategy)
11. [Health Monitoring](#11-health-monitoring)

---

## 1. Transaction History & Logging

**What it does:** Tracks every transaction with detailed metadata

### Features:
- ✅ Automatic logging to `logs/transactions.json`
- ✅ Filter by wallet, token, success/failure
- ✅ Export to CSV for analysis
- ✅ Search by date range
- ✅ Detailed transaction metadata

### Commands:

```bash
# View last 50 transactions
npm run bot -- history

# View last 100 transactions
npm run bot -- history -l 100

# Show only successful transactions
npm run bot -- history --success

# Show only failed transactions
npm run bot -- history --failed

# Filter by wallet
npm run bot -- history -w EutGGw

# Filter by token
npm run bot -- history -t 7bunMtCJrEYefAmQjFHwXaEKDpamLYPTEo4TfuyJpump

# Export to CSV
npm run bot -- history --export transactions.csv

# Combine filters
npm run bot -- history --success -l 20 --export success.csv
```

### What's logged:
```json
{
  "timestamp": 1699564823000,
  "date": "2025-11-09T20:54:43.000Z",
  "wallet": "EutGGwJp...",
  "tokenMint": "7bunMtCJrEYefAmQjFHwXaEKDpamLYPTEo4TfuyJpump",
  "type": "combined",
  "amount": 0.0045,
  "signature": "3hUuVJLu43...",
  "success": true,
  "fee": 0.0001,
  "slippage": 10,
  "executionTime": 1250
}
```

---

## 2. Dry Run / Simulation Mode

**What it does:** Test your settings without spending real SOL

### Usage:

```bash
# Dry run with all settings
npm run bot -- start -t YOUR_TOKEN --dry-run

# Test with specific configuration
npm run bot -- start \
  -t YOUR_TOKEN \
  --dry-run \
  -i 1000 \
  -s 25 \
  --min 30 \
  --max 70
```

### Output:
```
🧪 DRY RUN MODE - No real transactions will be sent

[1] 🧪 DRY RUN: Would trade 0.0045 SOL (45.23%)
[1] 🧪 Estimated fee: ~0.000090 SOL
[2] 🧪 DRY RUN: Would trade 0.0067 SOL (67.89%)
[2] 🧪 Estimated fee: ~0.000134 SOL

--- Stats after 10 executions ---
Success: 10, Errors: 0, Success rate: 100.00%
Total Volume: 0.112400 SOL (estimated)
Total Fees: 0.002248 SOL (estimated)
```

### Benefits:
- ✅ Test RPC connection
- ✅ Validate wallet balances
- ✅ Estimate costs before running
- ✅ Verify settings work
- ✅ No SOL spent!

---

## 3. Statistics & Analytics Dashboard

**What it does:** Comprehensive analytics on your volume injection

### Commands:

```bash
# View overall stats
npm run bot -- stats

# Stats for specific token
npm run bot -- stats -t 7bunMtCJrEYefAmQjFHwXaEKDpamLYPTEo4TfuyJpump

# Stats for last 7 days
npm run bot -- stats --days 7

# Stats for last 24 hours
npm run bot -- stats --days 1
```

### Output:
```
📊 Statistics & Analytics

Overall Statistics:
  Total Transactions: 156
  Successful: 124
  Failed: 32
  Success Rate: 79.49%

Volume & Fees:
  Total Volume: 1.245600 SOL
  Total Fees Paid: 0.024912 SOL
  Avg Fee per Tx: 0.000201 SOL

Performance:
  Avg Execution Time: 1250ms

Efficiency:
  Cost as % of Volume: 2.00%
```

### What you learn:
- 💰 Total volume created
- 💸 Total fees spent
- 📈 Success rate trends
- ⚡ Performance metrics
- 💡 Cost efficiency

---

## 4. Smart Slippage Adjustment

**What it does:** Automatically adjusts slippage for optimal success rate

### Usage:

```bash
# Enable smart slippage (targets 75% success rate)
npm run bot -- start \
  -t YOUR_TOKEN \
  --smart-slippage

# Set custom target success rate
npm run bot -- start \
  -t YOUR_TOKEN \
  --smart-slippage \
  --target-success-rate 80
```

### How it works:
```
Initial slippage: 10%
Success rate: 45% (too low)
→ Increase slippage to 15%

Success rate: 78% (good)
→ Keep slippage at 15%

Success rate: 92% (too high, wasting fees)
→ Decrease slippage to 13%

Target achieved: 75-80% success rate
```

### Output:
```
📈 Increasing slippage to 15% (success rate: 45.0%)
[Trades with 15% slippage]
--- Stats after 20 executions ---
Success: 15, Errors: 5, Success rate: 75.00%
```

### Benefits:
- ✅ Better success rates automatically
- ✅ Reduces wasted gas on failed transactions
- ✅ Optimizes cost vs success trade-off
- ✅ Adapts to market conditions

---

## 5. Auto-Refund System

**What it does:** Automatically refunds wallets when they run low

### Usage:

```bash
# Enable auto-refund (default threshold 0.008 SOL)
npm run bot -- start \
  -t YOUR_TOKEN \
  --auto-refund

# Custom refund threshold
npm run bot -- start \
  -t YOUR_TOKEN \
  --auto-refund \
  --refund-threshold 0.01
```

### How it works:
```
Wallet balance: 0.007 SOL (below threshold 0.008)
→ Auto-refund: Transfer 0.015 SOL from main wallet
→ New balance: 0.022 SOL
→ Continue trading
```

### Output:
```
[23] Using 45.67% of wallet balance: 0.0032 SOL
💸 Auto-refunding wallet EutGGwJp... with 0.015 SOL
✅ Auto-refund successful
[24] Using 52.34% of wallet balance: 0.0104 SOL
```

### Benefits:
- ✅ Keeps bot running continuously
- ✅ No manual intervention needed
- ✅ Wallets never run dry
- ✅ Set it and forget it

**Requirements:**
- Main wallet must have sufficient SOL
- Main wallet configured in setup

---

## 6. Target Volume & Budget Control

**What it does:** Stops automatically when goals reached

### Usage:

```bash
# Stop after 1 SOL in trading volume
npm run bot -- start \
  -t YOUR_TOKEN \
  --target-volume 1.0

# Stop after spending 0.1 SOL in fees
npm run bot -- start \
  -t YOUR_TOKEN \
  --max-budget 0.1

# Both limits (stops when either reached)
npm run bot -- start \
  -t YOUR_TOKEN \
  --target-volume 2.0 \
  --max-budget 0.05
```

### Output:
```
--- Stats after 50 executions ---
Success: 42, Errors: 8, Success rate: 84.00%
Total Volume: 0.984600 SOL
Total Fees: 0.019692 SOL
Progress to target: 98.5%

🎯 Target volume reached: 1.002400 SOL
🛑 Stopping bot...

Final stats: 43/51 successful executions
```

### Use cases:
- 💰 **Budget control:** Don't spend more than X SOL
- 📊 **Volume goals:** Create exactly X SOL in volume
- ⏱️ **Time limits:** Indirectly via volume targets
- 🎯 **Marketing:** "I want 5 SOL in volume"

---

## 7. Token Profile Management

**What it does:** Save and load configurations for different tokens

### Commands:

```bash
# Save a profile
npm run bot -- profile save mytoken \
  -t 7bunMtCJrEYefAmQjFHwXaEKDpamLYPTEo4TfuyJpump \
  -i 1000 \
  -s 25 \
  --min 30 \
  --max 70 \
  --auto-refund \
  --smart-slippage

# List all profiles
npm run bot -- profile list

# Show profile details
npm run bot -- profile show mytoken

# Delete a profile
npm run bot -- profile delete mytoken

# Use a profile
npm run bot -- start --profile mytoken
```

### Example profile list:
```
📋 Saved Profiles (3):

1. mytoken
   Token: 7bunMtCJrEYefAmQjFHwXaEKDpamLYPTEo4TfuyJpump
   Interval: 1000ms, Slippage: 25%
   Range: 30%-70%
   Auto-refund: Enabled (threshold: 0.008 SOL)
   Smart slippage: Enabled
   Last used: 2025-11-09 8:45:32 PM

2. conservative
   Token: 6vTbDWJgfYEXLAxA1v46ZnKn3nwAcbVkcwshG5eYpump
   Interval: 2000ms, Slippage: 15%
   Range: 20%-40%

3. aggressive
   Token: 8pLm3nQa...
   Interval: 500ms, Slippage: 50%
   Range: 60%-90%
   Target Volume: 5.000000 SOL
```

### Benefits:
- ✅ Quick switching between tokens
- ✅ No need to remember settings
- ✅ Share configs with team
- ✅ A/B test different strategies

---

## 8. Multi-RPC Failover

**What it does:** Automatically switches RPC when one fails

### How it works:
```
1. Try RPC endpoint #1 (Helius)
   ❌ Connection timeout

2. Switch to RPC endpoint #2 (Alchemy)
   ✅ Connected successfully

3. Continue trading with new RPC
   Track failures for each endpoint
```

### Output:
```
[45] Error: failed to get recent blockhash: fetch failed
⚠️ Switching RPC from endpoint 0 to 1
[46] Using 34.56% of wallet balance: 0.0035 SOL
✅ Transaction sent: 5fFyYQ...
```

### Benefits:
- ✅ No downtime from RPC issues
- ✅ Better reliability
- ✅ Automatic recovery
- ✅ Uses all configured RPCs

**Setup:** Configure multiple RPCs in `npm run bot setup`

---

## 9. Advanced Wallet Management

**What it does:** Better control over wallet lifecycle

### Commands:

```bash
# Generate 100 wallets without funding
npm run bot -- wallets generate 100

# Remove wallets with zero balance
npm run bot -- wallets cleanup
```

### Generate wallets:
```
✅ Generated 100 wallets (unfunded)
💡 Use "npm run bot -- distribute" to fund them.
```

### Cleanup wallets:
```
🔍 Checking wallet balances...

Removing: EutGGwJp... (0 SOL)
Removing: 9jL2qoom... (0 SOL)
Removing: CavFuCn2... (0 SOL)

✅ Cleanup complete!
   Kept: 47 wallets
   Removed: 53 wallets
```

### Use cases:
- 📋 **Pre-generate:** Create wallets in advance
- 🧹 **Cleanup:** Remove depleted wallets
- 💾 **Organization:** Better wallet management

---

## 10. Wallet Rotation Strategy

**What it does:** Evenly distributes trades across wallets

### How it works:
```
Instead of random selection:
  → Track usage count per wallet
  → Prefer least-used wallets
  → Select from top 30% least-used
  → Even distribution over time
```

### Benefits:
- ✅ Even wear across wallets
- ✅ More natural trading patterns
- ✅ Better for avoiding detection
- ✅ Automatic optimization

### Example:
```
Wallet usage after 100 trades:
  Wallet 0: 18 trades
  Wallet 1: 22 trades
  Wallet 2: 19 trades
  Wallet 3: 21 trades
  Wallet 4: 20 trades

Next trade: Wallet 0 (least used)
```

**Activated automatically** when using the enhanced injector

---

## 11. Health Monitoring

**What it does:** Tracks bot health and performance

### Monitored metrics:
- ✅ Success rate tracking
- ✅ RPC failure detection
- ✅ Wallet balance monitoring
- ✅ Execution time tracking
- ✅ Fee anomaly detection

### Output:
```
--- Stats after 10 executions ---
Success: 8, Errors: 2, Success rate: 80.00%
Total Volume: 0.112400 SOL
Total Fees: 0.002248 SOL
Avg Fee/Tx: 0.000281 SOL

⚠️ Success rate below target (80% < 85%)
📈 Increasing slippage to 15%
```

### Automatic actions:
- 🔄 Switch RPC on connection failures
- 📈 Adjust slippage on low success rate
- 💸 Refund wallets when low (if enabled)
- 🛑 Stop on target/budget reached

---

## 🎯 **Quick Start Examples**

### Conservative Mode (Safe & Steady):
```bash
npm run bot -- start \
  -t YOUR_TOKEN \
  -i 2000 \
  -s 20 \
  --min 20 \
  --max 40 \
  --auto-refund \
  --smart-slippage \
  --max-budget 0.1
```

### Aggressive Mode (High Volume):
```bash
npm run bot -- start \
  -t YOUR_TOKEN \
  -i 500 \
  -s 50 \
  --min 60 \
  --max 90 \
  --auto-refund \
  --target-volume 5.0
```

### Test Mode (No Risk):
```bash
npm run bot -- start \
  -t YOUR_TOKEN \
  --dry-run \
  -i 1000 \
  -s 25
```

### Profile Mode (Saved Settings):
```bash
# Save once
npm run bot -- profile save mytoken \
  -t YOUR_TOKEN \
  -i 1000 \
  -s 25 \
  --auto-refund \
  --smart-slippage

# Use anytime
npm run bot -- start --profile mytoken
```

---

## 📊 **Complete Command Reference**

### Main Commands:
```bash
npm run bot -- setup              # Initial configuration
npm run bot -- distribute         # Create & fund wallets
npm run bot -- balance            # Check wallet balances
npm run bot -- start              # Start bot (many options)
npm run bot -- collect            # Collect SOL back
npm run bot -- info               # View configuration
npm run bot -- history            # Transaction history
npm run bot -- stats              # Analytics dashboard
```

### Profile Commands:
```bash
npm run bot -- profile save <name> [options]
npm run bot -- profile list
npm run bot -- profile show <name>
npm run bot -- profile delete <name>
```

### Wallet Commands:
```bash
npm run bot -- wallets generate <number>
npm run bot -- wallets cleanup
```

### Start Options:
```bash
-t, --token <address>              Token mint address
-i, --interval <ms>                Execution interval
-s, --slippage <percent>           Slippage tolerance
--min <percent>                    Min trade percentage
--max <percent>                    Max trade percentage
--dry-run                          Simulate mode
--auto-refund                      Auto-fund wallets
--refund-threshold <sol>           Refund trigger
--target-volume <sol>              Volume goal
--max-budget <sol>                 Budget limit
--smart-slippage                   Auto-adjust slippage
--target-success-rate <percent>    Success rate target
-p, --profile <name>               Use saved profile
```

---

## 🚀 **Next Steps**

### Coming Soon (Not Yet Implemented):
- ⏰ **Scheduled Runs** - Run at specific times
- 📈 **Gas Optimization** - Dynamic fee calculation
- 🌐 **Web Dashboard** - Browser-based monitoring
- 🔌 **API Mode** - REST API control

### Currently Available:
✅ 11 major features fully implemented
✅ All core functionality working
✅ Production-ready code
✅ Comprehensive CLI

---

## 💡 **Tips & Best Practices**

1. **Always test with --dry-run first**
2. **Use profiles for different tokens**
3. **Enable smart-slippage for better results**
4. **Set max-budget to control costs**
5. **Check stats regularly**
6. **Export history for analysis**
7. **Use auto-refund for continuous operation**
8. **Monitor success rates**

---

**🎉 All features are ready to use! Download the latest version from GitHub.**
