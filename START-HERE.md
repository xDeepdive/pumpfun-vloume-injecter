# 🚀 PumpFun Volume Bot - Quick Start

## ⚡ Get Started in 5 Minutes

### 1️⃣ Install Dependencies
```bash
npm install
```

### 2️⃣ Setup Configuration
```bash
npm run bot -- setup
```
Enter your:
- RPC endpoints (Helius, Alchemy, QuickNode recommended)
- Main wallet private key (base58 format)

### 3️⃣ Create Trading Wallets
```bash
npm run bot -- distribute -n 5 -a 0.01
```
Creates 5 wallets with 0.01 SOL each

### 4️⃣ Check Balances
```bash
npm run bot -- balance
```
Color-coded display: 🔴 Red (low) 🟡 Yellow (medium) 🟢 Green (healthy)

### 5️⃣ Start Volume Bot

**Option A: Basic Mode**
```bash
npm run bot -- start -t YOUR_TOKEN_MINT
```

**Option B: With Gas Optimization (RECOMMENDED)**
```bash
npm run bot -- start-optimized -t YOUR_TOKEN_MINT
```
Saves up to 87.5% on gas fees!

### 🛑 Stop the Bot
Press `Ctrl+C`

---

## 🎯 Quick Commands Reference

### Essential Commands
```bash
npm run bot -- setup              # Configure (first time)
npm run bot -- distribute         # Create wallets
npm run bot -- balance            # Check balances
npm run bot -- start              # Start bot (basic)
npm run bot -- start-optimized    # Start with gas optimization
npm run bot -- collect            # Collect SOL back
npm run bot -- info               # View config
```

### Advanced Commands
```bash
npm run bot -- history            # Transaction history
npm run bot -- stats              # Analytics dashboard
npm run bot -- gas check          # Network congestion
npm run bot -- profile save       # Save configuration
npm run bot -- --help             # Show all commands
```

---

## 💡 Usage Examples

### Conservative Mode (Safe & Steady)
```bash
npm run bot -- start -t YOUR_TOKEN \
  -i 2000 \
  -s 30 \
  --dry-run
```

### Production Mode (All Features)
```bash
npm run bot -- start-optimized -t YOUR_TOKEN \
  --gas-level auto \
  --smart-slippage \
  --auto-refund \
  --target-volume 1.0
```

### Using Profiles (Save & Reuse)
```bash
# Save once
npm run bot -- profile save mytoken -t YOUR_TOKEN -s 25

# Use anytime
npm run bot -- start --profile mytoken
```

---

## 🚀 Advanced Features

### 12 Major Features Available:

1. **Transaction Logging** - Complete history with CSV export
2. **Dry Run Mode** - Test without real transactions
3. **Statistics Dashboard** - Real-time analytics
4. **Smart Slippage** - Auto-adjusts based on success rate
5. **Auto-Refund** - Automatically refunds low wallets
6. **Target Volume** - Set volume goals
7. **Budget Control** - Set spending limits
8. **Profile Management** - Save configurations
9. **Multi-RPC Failover** - Automatic switching
10. **Wallet Rotation** - Smart wallet selection
11. **Health Monitoring** - Track performance
12. **Gas Optimization** - Save up to 87.5% on fees

### Enable Advanced Features
```bash
npm run bot -- start -t YOUR_TOKEN \
  --smart-slippage \
  --auto-refund \
  --target-volume 5.0 \
  --max-budget 0.5 \
  --dry-run
```

---

## 📊 Monitor Performance

### View Transaction History
```bash
npm run bot -- history --limit 50
npm run bot -- history --export report.csv
```

### Check Statistics
```bash
npm run bot -- stats
```

Output example:
```
📊 Volume Bot Statistics
Total Transactions: 145
Success Rate: 87.6%
Total Volume: 2.456 SOL
Total Fees: 0.145 SOL
```

### Check Network Congestion
```bash
npm run bot -- gas check
```

---

## 💰 Cost Optimization

### Without Gas Optimization
- Gas fees: ~0.08 SOL per tx
- 100 txs = 8.00 SOL in fees

### With Gas Optimization (`--gas-level auto`)
- Gas fees: ~0.01 SOL per tx
- 100 txs = 1.00 SOL in fees
- **Saves 7.00 SOL (87.5%)**

### How to Enable
```bash
npm run bot -- start-optimized -t YOUR_TOKEN --gas-level auto
```

---

## ⚠️ Important Notes

### Legal & Risk
- ⚠️ **Legal Risk**: May constitute market manipulation in some jurisdictions
- 📜 **Compliance**: Ensure compliance with local laws
- 🎓 **Use Case**: Educational and authorized testing only

### Costs
- 💸 **Protocol Fees**: ~2% per transaction cycle
- ⛽ **Gas Fees**: Variable (optimize with `start-optimized`)
- 🔄 **Net Loss**: ~2% + gas fees per cycle

### Security
- 🔐 **Private Keys**: Never commit to Git
- 💾 **Backups**: Backup wallet keys securely
- 👀 **Monitoring**: Check balances regularly
- 🧪 **Testing**: Always test with `--dry-run` first

---

## 🛠️ Troubleshooting

### Common Issues

**"No configuration found"**
```bash
npm run bot -- setup
```

**"No wallets found"**
```bash
npm run bot -- distribute -n 5 -a 0.01
```

**Low success rate**
```bash
npm run bot -- start -t TOKEN --smart-slippage -s 30
```

**High gas fees**
```bash
npm run bot -- start-optimized -t TOKEN --gas-level low
```

**Wallets running low on SOL**
```bash
npm run bot -- start -t TOKEN --auto-refund
```

---

## 📚 Full Documentation

- **[README.md](README.md)** - Project overview and features
- **[FEATURES.md](FEATURES.md)** - Complete guide to all 12 features
- **[CLI-USAGE.md](CLI-USAGE.md)** - Detailed command reference
- **[INSTALLATION-GUIDE.md](INSTALLATION-GUIDE.md)** - Step-by-step installation

---

## 🎓 Learning Path

### Beginner
1. Read this guide
2. Run `npm install`
3. Run `npm run bot -- setup`
4. Create wallets with `distribute`
5. Test with `--dry-run`

### Intermediate
1. Use `--smart-slippage` and `--auto-refund`
2. Save profiles for different tokens
3. Monitor with `history` and `stats`
4. Optimize costs with gas commands

### Advanced
1. Use `start-optimized` with all features
2. Set target volumes and budgets
3. Analyze network congestion
4. Fine-tune parameters for your use case

---

## 🚦 Quick Decision Tree

**Just starting?**
→ Use `start` with `--dry-run`

**Want to save on fees?**
→ Use `start-optimized --gas-level auto`

**Need better success rate?**
→ Add `--smart-slippage -s 30`

**Wallets running low?**
→ Add `--auto-refund`

**Specific volume goal?**
→ Add `--target-volume 10.0`

**Limit spending?**
→ Add `--max-budget 0.5`

---

## 📞 Getting Help

```bash
# Show all commands
npm run bot -- --help

# Command-specific help
npm run bot -- start --help
npm run bot -- gas --help

# View current config
npm run bot -- info
```

---

**Ready to start?**

```bash
# 1. Install
npm install

# 2. Setup
npm run bot -- setup

# 3. Fund wallets
npm run bot -- distribute -n 5 -a 0.01

# 4. Start with optimization
npm run bot -- start-optimized -t YOUR_TOKEN --gas-level auto
```

**Good luck! 🚀**
