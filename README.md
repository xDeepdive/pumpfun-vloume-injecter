# PumpFun Volume Bot

A sophisticated Solana-based trading bot designed to inject volume into PumpFun tokens through automated buy/sell operations. This bot utilizes multiple wallets to create trading activity and simulate organic volume patterns.

## 🚀 Features

- **Automated Volume Injection**: Executes buy/sell transactions at configurable intervals
- **Multi-Wallet Support**: Distributes SOL across multiple wallets for realistic trading patterns
- **Jito Integration**: Supports both Jito bundle transactions and legacy transaction execution
- **Smart Slippage Management**: Implements dynamic slippage calculations for optimal execution
- **Real-time Monitoring**: Comprehensive logging and statistics tracking
- **Bonding Curve Integration**: Full support for PumpFun's bonding curve mechanics
- **Fee Optimization**: Advanced fee calculation and optimization strategies

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager
- Solana CLI tools
- RPC endpoints with API keys
- SOL for wallet funding and transaction fees

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pumpfun-volumebot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure RPC endpoints**
   Edit `config/index.ts` and add your RPC endpoint URLs with API keys:
   ```typescript
   export const RPCS_ENDPOINTS = [
     "https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY",
     "https://solana-mainnet.g.alchemy.com/v2/YOUR_API_KEY",
     // Add more endpoints for redundancy
   ]
   ```

4. **Set up wallet configuration**
   - Create a main wallet with sufficient SOL
   - Update `walletsHelpers/key.json` with your main wallet's private key
   - The bot will automatically generate and manage additional wallets

## ⚙️ Configuration

### Wallet Management

The bot includes several wallet management utilities:

- **`distributeSol.ts`**: Distributes SOL from main wallet to multiple trading wallets
- **`checkBalances.ts`**: Monitors wallet balances across all accounts
- **`saveAccounts.ts`**: Manages wallet key storage and retrieval

### Trading Parameters

Key configuration options in `src/volume.ts`:

```typescript
// Trading interval (milliseconds)
const interval = 500; // 0.5 seconds

// Random percentage of wallet balance to use (20-90%)
const randomPercent = Math.random() * (90 - 20) + 20;

// Minimum wallet balance threshold
const minBalance = 0.01 * LAMPORTS_PER_SOL;
```

### Target Token Configuration

Update the target token mint address in `src/volume.ts`:

```typescript
const mint = new PublicKey("YOUR_TOKEN_MINT_ADDRESS");
```

## 🚀 Usage

### Basic Volume Injection

1. **Start the volume bot**
   ```bash
   npm start
   # or
   npx ts-node src/volume.ts
   ```

2. **Monitor execution**
   The bot will:
   - Execute buy/sell transactions every 500ms
   - Use random wallet selection
   - Apply random percentage of wallet balance (20-90%)
   - Log detailed execution statistics

### Wallet Distribution

1. **Distribute SOL to multiple wallets**
   ```typescript
   import { distributeSol } from './walletsHelpers/distributeSol';
   
   const wallets = await distributeSol(connection, mainKeypair, numberOfWallets);
   ```

2. **Check wallet balances**
   ```typescript
   import { fetchAllWalletBalance } from './walletsHelpers/checkBalances';
   
   await fetchAllWalletBalance(connection);
   ```

### Jito Bundle Execution

For MEV protection and better execution:

```typescript
import { executeJitoTx } from './executor/jito';

const result = await executeJitoTx(transactions, payer, 'confirmed');
```

## 📊 Architecture

### Core Components

- **`PumpHelper`**: Main class for interacting with PumpFun protocol
- **`Volume Injector`**: Orchestrates buy/sell operations
- **`Wallet Manager`**: Handles multi-wallet operations
- **`Fee Calculator`**: Optimizes transaction fees
- **`Jito Executor`**: Manages bundle transactions

### Key Files

```
src/
├── pumpfunHelper.ts    # Core PumpFun protocol interactions
├── volume.ts          # Main volume injection logic
├── calculations.ts    # Bonding curve and price calculations
├── types.ts          # TypeScript type definitions
├── pda.ts            # Program Derived Address utilities
└── feeCalculator.ts  # Fee optimization (commented out)

walletsHelpers/
├── distributeSol.ts  # SOL distribution utilities
├── checkBalances.ts  # Balance monitoring
├── saveAccounts.ts   # Wallet key management
└── collect.ts        # Wallet collection utilities

executor/
├── jito.ts          # Jito bundle execution
└── legacy.ts        # Standard transaction execution

config/
├── index.ts         # RPC endpoint configuration
└── getWallet.ts     # Wallet retrieval utilities
```

## 🔧 Advanced Configuration

### Custom Trading Strategies

Modify the volume injection logic in `src/volume.ts`:

```typescript
// Custom trading parameters
const customParams = {
  minTradeAmount: 0.001, // Minimum SOL per trade
  maxTradeAmount: 0.1,   // Maximum SOL per trade
  slippageTolerance: 0.1, // 10% slippage
  tradeInterval: 1000,   // 1 second intervals
};
```

### RPC Load Balancing

The bot automatically rotates between RPC endpoints for optimal performance:

```typescript
const RANDOM_RPC = RPCS_ENDPOINTS[Math.floor(Math.random() * RPCS_ENDPOINTS.length)];
```

### Error Handling

Comprehensive error handling includes:
- Network connectivity issues
- Insufficient balance detection
- Transaction simulation failures
- RPC endpoint failures

## 📈 Monitoring and Statistics

The bot provides real-time statistics:

```
--- Stats after 10 executions ---
Success: 8, Errors: 2, Success rate: 80.00%
```

Key metrics tracked:
- Total executions
- Success/failure rates
- Average execution time
- Wallet balance distribution

## ⚠️ Important Considerations

### Legal and Ethical Use

- **Compliance**: Ensure compliance with local regulations and platform terms of service
- **Market Manipulation**: Be aware of potential market manipulation implications
- **Responsible Trading**: Use appropriate trade sizes and intervals

### Risk Management

- **Wallet Security**: Keep private keys secure and never commit them to version control
- **Balance Monitoring**: Regularly check wallet balances to prevent depletion
- **Network Fees**: Account for transaction fees in your SOL allocation
- **Slippage**: Monitor slippage impact on trade execution

### Technical Considerations

- **RPC Limits**: Respect RPC endpoint rate limits
- **Network Congestion**: Adjust intervals during high network activity
- **Token Liquidity**: Ensure target token has sufficient liquidity
- **Bonding Curve State**: Monitor bonding curve completion status

## 🛡️ Security Best Practices

1. **Environment Variables**: Use environment variables for sensitive data
2. **Key Management**: Implement secure key storage solutions
3. **Network Security**: Use HTTPS endpoints and validate SSL certificates
4. **Code Review**: Regularly review and audit trading logic
5. **Backup Strategy**: Maintain secure backups of wallet keys

## 📝 License

This project is for educational and research purposes. Please ensure compliance with all applicable laws and regulations before use.

## 🤝 Contributing

Contributions are welcome! Please ensure:
- Code follows TypeScript best practices
- Comprehensive error handling
- Detailed documentation
- Test coverage for new features

## 📞 Support

For issues and questions:
- Check the existing issues in the repository
- Review the code documentation
- Ensure proper configuration before reporting bugs

---

**Disclaimer**: This software is provided for educational purposes only. Trading cryptocurrencies involves substantial risk of loss. The authors are not responsible for any financial losses incurred through the use of this software.
