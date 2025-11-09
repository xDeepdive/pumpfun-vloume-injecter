# 🚀 PumpFun Volume Bot - Quick Start

## ⚡ Get Started in 5 Minutes

### 1️⃣ Install Dependencies
```bash
npm install
```

### 2️⃣ Setup Configuration
```bash
npm run bot setup
```
Enter your:
- RPC endpoints (Helius, Alchemy)
- Main wallet private key

### 3️⃣ Create Trading Wallets
```bash
npm run bot distribute
```
Creates 20 wallets with 0.01 SOL each (customizable)

### 4️⃣ Check Balances
```bash
npm run bot balance
```

### 5️⃣ Start Volume Bot
```bash
npm run bot start
```
Enter your token mint address when prompted

### 🛑 Stop the Bot
Press `Ctrl+C`

---

## 📚 Full Documentation

- **Complete Installation Guide:** `INSTALLATION-GUIDE.md`
- **CLI Command Reference:** `CLI-USAGE.md`
- **Project Overview:** `README.md`

## 💡 Quick Commands

```bash
npm run bot setup          # Configure (first time)
npm run bot distribute     # Create wallets
npm run bot balance        # Check balances
npm run bot start          # Start bot
npm run bot info           # View config
npm run bot -- --help      # Show all commands
```

## 🎯 Example Usage

```bash
# Start with specific token and custom settings
npm run bot start \
  -t YOUR_TOKEN_MINT_ADDRESS \
  -i 1000 \
  -s 15 \
  --min 30 \
  --max 70
```

**Parameters:**
- `-t` = Token address
- `-i` = Interval (ms)
- `-s` = Slippage (%)
- `--min/--max` = Trade size (%)

---

## ⚠️ Important

- ⚠️ **Legal Risk:** May constitute market manipulation
- 💸 **Cost:** ~2% fees per transaction cycle
- 🔐 **Security:** Never commit private keys to Git
- 📖 **Read:** Full installation guide before using

---

## 📞 Need Help?

See `INSTALLATION-GUIDE.md` for:
- Complete installation steps
- Troubleshooting guide
- Cost estimation
- Security best practices
- Legal warnings

---

**Ready to start?** Run: `npm install`
