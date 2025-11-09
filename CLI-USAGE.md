# PumpFun Volume Bot - CLI Usage Guide

Easy-to-use command-line interface for the PumpFun volume injection bot.

## Quick Start

### 1. Initial Setup
```bash
npm run bot setup
```

This interactive command will:
- Configure your RPC endpoints (Helius, Alchemy, etc.)
- Set up your main wallet (private key)
- Save configuration for future use

**You'll need:**
- Helius API key: https://www.helius.dev/
- Alchemy API key: https://www.alchemy.com/
- Your main wallet private key (base58 or JSON array format)

---

### 2. Create Trading Wallets
```bash
npm run bot distribute
```

**Options:**
- `-n, --number <number>` - Number of wallets to create (default: 20)
- `-a, --amount <amount>` - SOL per wallet (default: 0.01)

**Examples:**
```bash
# Create 20 wallets with 0.01 SOL each
npm run bot distribute

# Create 50 wallets with 0.02 SOL each
npm run bot distribute -n 50 -a 0.02
```

**Requirements:**
- Main wallet must have enough SOL
- Minimum: (number_of_wallets × amount_per_wallet) + 0.05 SOL for fees

---

### 3. Check Wallet Balances
```bash
npm run bot balance
```

Shows:
- Balance of each trading wallet
- Total balance across all wallets
- Average balance per wallet
- Wallet addresses

**Color coding:**
- 🔴 Red: < 0.001 SOL (critical - needs funding)
- 🟡 Yellow: < 0.01 SOL (low)
- 🟢 Green: ≥ 0.01 SOL (healthy)

---

### 4. Start Volume Injection
```bash
npm run bot start
```

**Options:**
- `-t, --token <address>` - Token mint address
- `-i, --interval <ms>` - Execution interval in milliseconds (default: 500)
- `-s, --slippage <percent>` - Slippage tolerance 1-100 (default: 10)
- `--min <percent>` - Minimum trade percentage (default: 20)
- `--max <percent>` - Maximum trade percentage (default: 90)

**Examples:**
```bash
# Interactive mode (prompts for token address)
npm run bot start

# With token address
npm run bot start -t 6vTbDWJgfYEXLAxA1v46ZnKn3nwAcbVkcwshG5eYpump

# Custom settings
npm run bot start -t YOUR_TOKEN -i 1000 -s 15 --min 30 --max 80

# Slower execution (every 2 seconds)
npm run bot start -t YOUR_TOKEN -i 2000

# Higher slippage for volatile tokens
npm run bot start -t YOUR_TOKEN -s 20
```

**Stop the bot:**
Press `Ctrl+C` to stop gracefully

---

### 5. View Configuration
```bash
npm run bot info
```

Shows:
- Configured RPC endpoints
- Main wallet address
- Number of trading wallets created

---

## Complete Workflow Example

```bash
# 1. Setup (first time only)
npm run bot setup
# Enter RPC endpoints and main wallet key

# 2. Fund main wallet (if needed)
# Transfer SOL to your main wallet address shown in setup

# 3. Create 30 trading wallets
npm run bot distribute -n 30 -a 0.01

# 4. Verify balances
npm run bot balance

# 5. Start volume injection
npm run bot start -t 6vTbDWJgfYEXLAxA1v46ZnKn3nwAcbVkcwshG5eYpump -i 500

# 6. Monitor and stop when desired (Ctrl+C)
```

---

## All Available Commands

| Command | Description |
|---------|-------------|
| `npm run bot setup` | Initial configuration (RPC + wallet) |
| `npm run bot distribute` | Create and fund trading wallets |
| `npm run bot balance` | Check all wallet balances |
| `npm run bot start` | Start volume injection bot |
| `npm run bot info` | Show current configuration |
| `npm run bot -- --help` | Show all commands and options |

---

## Configuration Files

The CLI creates these files:

```
.pumpfun-config/
├── config.json           # RPC endpoints and settings
└── main-wallet.json      # Main wallet private key (KEEP SECURE!)

keys/
└── data.json            # Trading wallet private keys (AUTO-GENERATED)

config/
└── index.ts             # RPC configuration (AUTO-UPDATED)
```

**Security Note:** Never commit `.pumpfun-config/` or `keys/` to version control!

---

## Troubleshooting

### "No configuration found"
**Solution:** Run `npm run bot setup` first

### "No wallets found"
**Solution:** Run `npm run bot distribute` to create wallets

### "Insufficient balance"
**Solution:**
1. Check main wallet balance with `npm run bot info`
2. Send more SOL to the main wallet address
3. Run `npm run bot distribute` again

### "Transaction simulation failed"
**Solution:**
- Increase slippage: `npm run bot start -t TOKEN -s 20`
- Check if token bonding curve is still active
- Verify RPC endpoints are working

### Wallets running out of SOL
**Solution:**
- Reduce trade percentage: `--min 10 --max 50`
- Increase interval: `-i 2000`
- Fund wallets with more SOL: `npm run bot distribute -a 0.02`

---

## Cost Estimation

**Per buy/sell cycle:**
- Network fee: ~0.000005 SOL
- PumpFun fees: ~2% of trade amount
- **Net loss:** ~2% per cycle

**Example at 500ms interval (2 trades/sec):**
- 7,200 transactions per hour
- With 0.01 SOL trades: ~0.14 SOL lost in fees per hour
- **Budget accordingly!**

---

## Safety Tips

✅ **DO:**
- Test with small amounts first
- Monitor balances regularly
- Use rate limiting (higher intervals)
- Keep private keys secure

❌ **DON'T:**
- Commit private keys to Git
- Run without sufficient balance
- Use maximum settings without testing
- Leave bot running unmonitored

---

## Getting Help

```bash
# General help
npm run bot -- --help

# Command-specific help
npm run bot start --help
npm run bot distribute --help
```

---

**⚠️ IMPORTANT DISCLAIMER:**

This tool creates artificial trading volume which may constitute market manipulation and could be illegal in many jurisdictions. Use only for:
- Authorized penetration testing
- Educational purposes with test tokens
- Research in controlled environments
- With explicit authorization

All blockchain transactions are permanent and publicly visible.
