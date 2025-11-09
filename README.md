# PumpFun Volume Bot

A sophisticated Solana-based trading bot designed to inject volume into PumpFun tokens through automated buy/sell operations. Features a comprehensive CLI interface with 12 advanced features including gas optimization, smart slippage, auto-refund, and transaction logging.

## 🚀 Features

### Core Features
- **Automated Volume Injection**: Executes buy/sell transactions at configurable intervals
- **Multi-Wallet Support**: Distributes SOL across multiple wallets for realistic trading patterns
- **Interactive CLI Interface**: User-friendly command-line interface with 15+ commands
- **Bonding Curve Integration**: Full support for PumpFun's bonding curve mechanics

### Advanced Features (12 Implemented)
- **Transaction History & Logging**: Complete transaction tracking with CSV export
- **Dry Run Mode**: Test without sending real transactions
- **Statistics Dashboard**: Real-time analytics and performance metrics
- **Smart Slippage Adjustment**: Auto-adjusts slippage based on success rate
- **Auto-Refund System**: Automatically refunds low-balance wallets
- **Target Volume & Budget Control**: Set goals and spending limits
- **Token Profile Management**: Save and reuse configurations
- **Multi-RPC Failover**: Automatic switching between RPC endpoints
- **Advanced Wallet Management**: Generate and cleanup wallets
- **Wallet Rotation Strategy**: Smart wallet selection for better distribution
- **Health Monitoring**: Track performance and system health
- **Gas Optimization**: Priority fee management with 87.5% cost savings

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager
- RPC endpoint URLs (Helius, Alchemy, or QuickNode recommended)
- SOL for wallet funding and transaction fees

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pumpfun-vloume-injecter
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure the bot**
   ```bash
   npm run bot -- setup
   ```

   You'll be prompted to:
   - Add RPC endpoint URLs (e.g., `https://mainnet.helius-rpc.com/?api-key=YOUR_KEY`)
   - Provide your main wallet private key (base58 encoded)

4. **Create and fund trading wallets**
   ```bash
   npm run bot -- distribute -n 5 -a 0.01
   ```

   This creates 5 wallets with 0.01 SOL each

## 🚀 Quick Start

### 1. Check Configuration
```bash
npm run bot -- info
```

### 2. Check Wallet Balances
```bash
npm run bot -- balance
```

### 3. Start Volume Injection (Basic)
```bash
npm run bot -- start -t YOUR_TOKEN_MINT_ADDRESS
```

### 4. Start with Advanced Features
```bash
npm run bot -- start \
  -t YOUR_TOKEN_MINT_ADDRESS \
  -i 1000 \
  -s 25 \
  --smart-slippage \
  --auto-refund \
  --target-volume 1.0
```

### 5. Start with Gas Optimization (RECOMMENDED)
```bash
npm run bot -- start-optimized \
  -t YOUR_TOKEN_MINT_ADDRESS \
  --gas-level auto \
  --smart-slippage \
  --auto-refund
```

## 📊 CLI Commands

### Main Commands
```bash
npm run bot -- setup              # Initial setup
npm run bot -- distribute         # Create & fund wallets
npm run bot -- balance            # Check balances
npm run bot -- start              # Start bot
npm run bot -- start-optimized    # Start with gas optimization
npm run bot -- collect            # Collect SOL back
npm run bot -- info               # View config
```

### Advanced Commands
```bash
npm run bot -- history            # Transaction history
npm run bot -- stats              # Analytics dashboard
npm run bot -- profile save <name>  # Save configuration
npm run bot -- wallets generate 10  # Generate 10 wallets
npm run bot -- gas check          # Check network congestion
npm run bot -- gas estimate       # Estimate fees
```

## ⚙️ Configuration Options

### Start Command Options
```bash
-t, --token <address>           Token mint address
-i, --interval <ms>             Execution interval (default: 500ms)
-s, --slippage <percent>        Slippage tolerance (default: 10%)
--min <percent>                 Min trade % (default: 20%)
--max <percent>                 Max trade % (default: 90%)
--dry-run                       Simulate without real txs
--auto-refund                   Auto-fund low wallets
--smart-slippage                Auto-adjust slippage
--target-volume <sol>           Stop at volume goal
--max-budget <sol>              Stop at budget limit
-p, --profile <name>            Use saved profile
```

### Gas Optimization Options
```bash
--gas-level <level>             low, medium, high, veryHigh, auto
--max-gas-price <microLamports> Maximum gas price cap
```

## 📊 Architecture

### Core Components

- **CLI Interface** (`cli.ts`): Interactive command-line interface with 15+ commands
- **EnhancedVolumeInjector** (`volumeEnhanced.ts`): Advanced volume injection with all 12 features
- **PumpHelper** (`pumpfunHelper.ts`): Core PumpFun protocol interactions
- **GasOptimizer** (`gasOptimizer.ts`): Priority fee management and network analysis
- **TransactionLogger** (`logger.ts`): Transaction history and analytics
- **ProfileManager** (`profiles.ts`): Configuration management

### Project Structure

```
pumpfun-vloume-injecter/
├── cli.ts                      # Main CLI interface
├── src/
│   ├── pumpfunHelper.ts       # PumpFun protocol integration
│   ├── volume.ts              # Basic volume injector
│   ├── volumeEnhanced.ts      # Enhanced injector (12 features)
│   ├── gasOptimizer.ts        # Gas optimization engine
│   ├── logger.ts              # Transaction logging
│   ├── profiles.ts            # Profile management
│   ├── calculations.ts        # Bonding curve math
│   ├── types.ts               # Type definitions
│   └── pda.ts                 # PDA utilities
├── walletsHelpers/
│   ├── distributeSol.ts       # Wallet creation & funding
│   ├── checkBalances.ts       # Balance checking
│   └── saveAccounts.ts        # Key management
├── config/
│   └── index.ts               # RPC configuration
├── .pumpfun-config/
│   ├── config.json            # Bot configuration
│   └── main-wallet.json       # Main wallet key
├── keys/
│   └── data.json              # Trading wallet keys
└── logs/
    └── transactions.json      # Transaction history
```

## 📈 Example Usage

### Conservative Mode (Safe & Steady)
```bash
npm run bot -- start \
  -t YOUR_TOKEN \
  -i 2000 \
  -s 30 \
  --min 20 \
  --max 50 \
  --dry-run
```

### Aggressive Mode (High Volume)
```bash
npm run bot -- start \
  -t YOUR_TOKEN \
  -i 500 \
  -s 15 \
  --min 40 \
  --max 90 \
  --smart-slippage \
  --target-volume 5.0
```

### Production Mode (All Features)
```bash
npm run bot -- start-optimized \
  -t YOUR_TOKEN \
  --gas-level auto \
  --smart-slippage \
  --auto-refund \
  --target-volume 10.0 \
  --max-budget 0.5
```

### Using Saved Profiles
```bash
# Save profile once
npm run bot -- profile save mytoken \
  -t YOUR_TOKEN \
  -i 1000 \
  -s 25 \
  --auto-refund

# Use anytime
npm run bot -- start --profile mytoken
```

## 📊 Monitoring and Statistics

### Real-time Output
```
[1] Using 45.67% of wallet balance: 0.0045 SOL
[1] Simulation result: SUCCESS
[1] Priority level: auto, Est. gas fee: 0.008500 SOL
[1] Transaction sent: 5fFyYQx3...

--- Stats after 10 executions ---
Success: 9, Errors: 1, Success rate: 90.00%
Total Volume: 0.084500 SOL
Total Protocol Fees: 0.001690 SOL
Total Gas Fees: 0.076500 SOL
Total Fees (Protocol + Gas): 0.078190 SOL
Avg Fee/Tx: 0.008688 SOL
```

### Transaction History
```bash
npm run bot -- history --limit 50
npm run bot -- history --success-only
npm run bot -- history --export history.csv
```

### Analytics Dashboard
```bash
npm run bot -- stats
```

Output:
```
📊 Volume Bot Statistics

Period: Last 24 hours
Total Transactions: 145
Success Rate: 87.6%
Total Volume: 2.456 SOL
Total Fees: 0.145 SOL

Average Transaction Size: 0.017 SOL
Average Success Rate: 87.6%
Most Active Wallet: 7xKD... (24 txs)
```

## 💡 Best Practices

### Gas Optimization Tips
- **Use `auto` mode** for network-adaptive fees (recommended)
- **Check network first**: Run `npm run bot -- gas check` before starting
- **Set max price**: Use `--max-gas-price` to cap costs during spikes
- **Monitor savings**: Gas fees shown separately in stats

### Success Rate Optimization
- **Enable smart slippage**: Automatically adjusts based on success rate
- **Start conservative**: Use 25-30% slippage initially
- **Use slower intervals**: 1000ms+ for better success rates
- **Enable auto-refund**: Prevents wallet depletion issues

### Wallet Management
- **Create enough wallets**: 5-10 wallets recommended
- **Monitor balances**: Use `npm run bot -- balance` regularly
- **Collect funds**: Use `npm run bot -- collect` to recover SOL
- **Rotate wallets**: Enabled by default in enhanced mode

### Profile Management
- **Save configurations**: Create profiles for different tokens
- **Test with dry-run**: Always test new profiles first
- **Set budgets**: Use `--max-budget` to control spending
- **Set targets**: Use `--target-volume` to automate stopping

## ⚠️ Important Considerations

### Legal and Ethical Use
- **Compliance**: Ensure compliance with local regulations and platform terms
- **Market Manipulation**: Be aware of potential legal implications
- **Responsible Trading**: Use appropriate trade sizes and intervals
- **Disclosure**: Understand and comply with disclosure requirements

### Risk Management
- **Wallet Security**: Keep private keys secure, never commit to version control
- **Balance Monitoring**: Check balances regularly to prevent depletion
- **Network Fees**: Account for both protocol and gas fees
- **Slippage Impact**: Monitor slippage on trade execution
- **Start Small**: Test with small amounts first

### Technical Considerations
- **RPC Limits**: Respect rate limits, use multiple endpoints
- **Network Congestion**: Use gas optimization during peak times
- **Token Liquidity**: Ensure sufficient liquidity in bonding curve
- **Success Rate**: Aim for 75%+ with proper configuration

## 🛡️ Security Best Practices

1. **Key Storage**: Configuration stored in `.pumpfun-config/` (gitignored)
2. **Private Keys**: Never share or commit private keys
3. **RPC Endpoints**: Use authenticated endpoints for better reliability
4. **Regular Backups**: Backup wallet keys securely
5. **Monitor Activity**: Check transaction history regularly

## 📚 Documentation

- **[FEATURES.md](FEATURES.md)**: Complete guide to all 12 advanced features
- **[CLI-USAGE.md](CLI-USAGE.md)**: Detailed CLI command reference
- **[INSTALLATION-GUIDE.md](INSTALLATION-GUIDE.md)**: Step-by-step installation
- **[START-HERE.md](START-HERE.md)**: Quick start guide

## 🚀 What's New

### Version 2.0 - Advanced Features Release
- ✅ Complete CLI interface with 15+ commands
- ✅ Gas optimization with 87.5% cost savings
- ✅ Smart slippage adjustment
- ✅ Auto-refund system
- ✅ Transaction logging and analytics
- ✅ Profile management
- ✅ Multi-RPC failover
- ✅ Wallet rotation strategy
- ✅ Real-time statistics dashboard

## 🛠️ Troubleshooting

### Common Issues

**Issue**: "No configuration found"
```bash
Solution: Run setup first
npm run bot -- setup
```

**Issue**: "No wallets found"
```bash
Solution: Create and fund wallets
npm run bot -- distribute -n 5 -a 0.01
```

**Issue**: Low success rate (<50%)
```bash
Solution: Increase slippage and interval
npm run bot -- start -t TOKEN --smart-slippage -i 1500 -s 30
```

**Issue**: High gas fees
```bash
Solution: Use gas optimization
npm run bot -- start-optimized -t TOKEN --gas-level low
```

**Issue**: Wallets running low on SOL
```bash
Solution: Enable auto-refund
npm run bot -- start -t TOKEN --auto-refund
```

## 📝 License

This project is for educational and research purposes. Please ensure compliance with all applicable laws and regulations before use.

## 🤝 Contributing

Contributions are welcome! Please ensure:
- Code follows TypeScript best practices
- Comprehensive error handling
- Documentation updates
- Test with dry-run mode first

## 📞 Support

- **Documentation**: Check [FEATURES.md](FEATURES.md) for detailed guides
- **Issues**: Report bugs via GitHub issues
- **Questions**: Review [CLI-USAGE.md](CLI-USAGE.md) for command help

---

**Disclaimer**: This software is provided for educational purposes only. Trading cryptocurrencies involves substantial risk of loss. The authors are not responsible for any financial losses incurred through the use of this software. Always comply with local laws and regulations.
