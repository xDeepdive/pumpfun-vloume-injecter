/**
 * Anti-Detection Module
 * Features: Non-linear patterns, organic sizing, timing entropy, funding obfuscation
 */

import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';

// Feature 3: Non-Linear Trade Patterns
export enum TradePattern {
  RANDOM_WALK = 'random_walk',
  MOMENTUM = 'momentum',
  MEAN_REVERSION = 'mean_reversion',
  WAVE = 'wave',
  TRENDING = 'trending',
  SIDEWAYS = 'sideways',
}

export class TradePatternEngine {
  private pattern: TradePattern;
  private lastAction: 'buy' | 'sell' = 'buy';
  private consecutiveCount = 0;
  private wavePhase = 0;

  constructor(pattern?: TradePattern) {
    this.pattern = pattern || this.selectRandomPattern();
  }

  selectRandomPattern(): TradePattern {
    const patterns = Object.values(TradePattern);
    return patterns[Math.floor(Math.random() * patterns.length)];
  }

  getNextAction(): 'buy' | 'sell' {
    switch (this.pattern) {
      case TradePattern.RANDOM_WALK:
        return Math.random() > 0.5 ? 'buy' : 'sell';

      case TradePattern.MOMENTUM:
        // Tends to continue in same direction (70% chance)
        if (Math.random() < 0.7) {
          this.consecutiveCount++;
          return this.lastAction;
        } else {
          this.consecutiveCount = 0;
          this.lastAction = this.lastAction === 'buy' ? 'sell' : 'buy';
          return this.lastAction;
        }

      case TradePattern.MEAN_REVERSION:
        // Tends to reverse direction (70% chance)
        if (Math.random() < 0.7) {
          this.lastAction = this.lastAction === 'buy' ? 'sell' : 'buy';
        }
        return this.lastAction;

      case TradePattern.WAVE:
        // Sine wave pattern
        this.wavePhase += 0.3;
        const waveValue = Math.sin(this.wavePhase);
        return waveValue > 0 ? 'buy' : 'sell';

      case TradePattern.TRENDING:
        // 60% buy, 40% sell (uptrend)
        return Math.random() < 0.6 ? 'buy' : 'sell';

      case TradePattern.SIDEWAYS:
        // Balanced but in clusters
        if (this.consecutiveCount > 3) {
          this.consecutiveCount = 0;
          this.lastAction = this.lastAction === 'buy' ? 'sell' : 'buy';
        } else {
          this.consecutiveCount++;
        }
        return this.lastAction;

      default:
        return Math.random() > 0.5 ? 'buy' : 'sell';
    }
  }

  // Change pattern periodically (every 20-50 trades)
  maybeChangePattern() {
    if (Math.random() < 0.05) {
      this.pattern = this.selectRandomPattern();
      this.consecutiveCount = 0;
      console.log(`🔄 Pattern changed to: ${this.pattern}`);
    }
  }
}

// Feature 4: Organic Transaction Sizing
export enum SizingStrategy {
  BELL_CURVE = 'bell_curve',
  FIBONACCI = 'fibonacci',
  POWER_LAW = 'power_law',
  UNIFORM = 'uniform',
}

export class OrganicSizer {
  private strategy: SizingStrategy;

  constructor(strategy?: SizingStrategy) {
    this.strategy = strategy || SizingStrategy.BELL_CURVE;
  }

  // Box-Muller transform for normal distribution
  private boxMuller(): number {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  getTradeSize(minPercent: number, maxPercent: number): number {
    const range = maxPercent - minPercent;
    const midpoint = (minPercent + maxPercent) / 2;

    switch (this.strategy) {
      case SizingStrategy.BELL_CURVE:
        // Normal distribution centered at midpoint
        let size = midpoint + this.boxMuller() * (range / 6);
        return Math.max(minPercent, Math.min(maxPercent, size));

      case SizingStrategy.FIBONACCI:
        // Fibonacci ratios: 0.236, 0.382, 0.5, 0.618, 0.786
        const fibRatios = [0.236, 0.382, 0.5, 0.618, 0.786];
        const ratio = fibRatios[Math.floor(Math.random() * fibRatios.length)];
        return minPercent + range * ratio;

      case SizingStrategy.POWER_LAW:
        // More small trades, fewer large trades
        const powerLaw = Math.pow(Math.random(), 2);
        return minPercent + range * powerLaw;

      case SizingStrategy.UNIFORM:
      default:
        return minPercent + Math.random() * range;
    }
  }
}

// Feature 12: Transaction Timing Entropy
export enum TimingMode {
  BURST = 'burst',
  SILENT = 'silent',
  NORMAL = 'normal',
}

export class TimingController {
  private mode: TimingMode = TimingMode.NORMAL;
  private modeStartTime: number = Date.now();
  private modeDuration: number = 0;

  getNextInterval(baseInterval: number): number {
    this.updateMode();

    switch (this.mode) {
      case TimingMode.BURST:
        // Very fast trades (30-70% of base)
        return baseInterval * (0.3 + Math.random() * 0.4);

      case TimingMode.SILENT:
        // Very slow trades (300-800% of base)
        return baseInterval * (3 + Math.random() * 5);

      case TimingMode.NORMAL:
      default:
        // Normal variation (70-130% of base)
        return baseInterval * (0.7 + Math.random() * 0.6);
    }
  }

  private updateMode() {
    // Check if current mode expired
    if (Date.now() - this.modeStartTime > this.modeDuration) {
      this.selectNewMode();
    }
  }

  private selectNewMode() {
    const rand = Math.random();
    if (rand < 0.15) {
      // 15% chance of burst mode
      this.mode = TimingMode.BURST;
      this.modeDuration = (2 + Math.random() * 3) * 60 * 1000; // 2-5 minutes
      console.log(`⚡ Entering BURST mode for ${(this.modeDuration / 60000).toFixed(1)} minutes`);
    } else if (rand < 0.3) {
      // 15% chance of silent mode
      this.mode = TimingMode.SILENT;
      this.modeDuration = (5 + Math.random() * 10) * 60 * 1000; // 5-15 minutes
      console.log(`🤫 Entering SILENT mode for ${(this.modeDuration / 60000).toFixed(1)} minutes`);
    } else {
      // 70% chance of normal mode
      this.mode = TimingMode.NORMAL;
      this.modeDuration = (10 + Math.random() * 20) * 60 * 1000; // 10-30 minutes
    }
    this.modeStartTime = Date.now();
  }

  getCurrentMode(): TimingMode {
    return this.mode;
  }
}

// Feature 11: Funding Source Obfuscation
export class FundingObfuscator {
  private intermediaryWallets: Keypair[] = [];
  private connection: Connection;

  constructor(connection: Connection, numIntermediaries: number = 5) {
    this.connection = connection;
    this.generateIntermediaries(numIntermediaries);
  }

  private generateIntermediaries(count: number) {
    for (let i = 0; i < count; i++) {
      this.intermediaryWallets.push(Keypair.generate());
    }
    console.log(`🔐 Generated ${count} intermediary wallets for funding obfuscation`);
  }

  // Multi-hop funding: Master -> Intermediary -> Trading Wallet
  async fundWalletWithHops(
    masterKeypair: Keypair,
    targetWallet: PublicKey,
    amountSOL: number,
    hops: number = 2
  ): Promise<string[]> {
    const signatures: string[] = [];

    // Random amount variation (±10%)
    const variation = 0.9 + Math.random() * 0.2;
    const actualAmount = amountSOL * variation;

    if (hops === 1) {
      // Direct funding (less secure)
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: masterKeypair.publicKey,
          toPubkey: targetWallet,
          lamports: actualAmount * LAMPORTS_PER_SOL,
        })
      );
      const sig = await this.connection.sendTransaction(tx, [masterKeypair]);
      return [sig];
    }

    // Select random intermediary
    const intermediary = this.intermediaryWallets[Math.floor(Math.random() * this.intermediaryWallets.length)];

    try {
      // Hop 1: Master -> Intermediary (with extra for fees)
      const tx1 = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: masterKeypair.publicKey,
          toPubkey: intermediary.publicKey,
          lamports: (actualAmount + 0.001) * LAMPORTS_PER_SOL,
        })
      );
      const sig1 = await this.connection.sendTransaction(tx1, [masterKeypair]);
      signatures.push(sig1);

      // Wait random time (2-10 seconds) to avoid timestamp clustering
      await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 8000));

      // Hop 2: Intermediary -> Target
      const tx2 = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: intermediary.publicKey,
          toPubkey: targetWallet,
          lamports: actualAmount * LAMPORTS_PER_SOL,
        })
      );
      const sig2 = await this.connection.sendTransaction(tx2, [intermediary]);
      signatures.push(sig2);

      return signatures;
    } catch (error) {
      console.error('❌ Multi-hop funding failed:', error);
      throw error;
    }
  }

  // Simulate CEX funding pattern (batch funding with varied amounts)
  async simulateCEXFunding(
    masterKeypair: Keypair,
    targetWallets: PublicKey[],
    totalSOL: number
  ): Promise<void> {
    // Distribute with random amounts (looks like CEX withdrawal)
    const amounts: number[] = [];
    let remaining = totalSOL;

    for (let i = 0; i < targetWallets.length - 1; i++) {
      const amount = remaining * (0.05 + Math.random() * 0.15); // 5-20% each
      amounts.push(amount);
      remaining -= amount;
    }
    amounts.push(remaining);

    // Shuffle to avoid sequential pattern
    const shuffled = targetWallets
      .map((wallet, i) => ({ wallet, amount: amounts[i] }))
      .sort(() => Math.random() - 0.5);

    // Fund with delays
    for (const { wallet, amount } of shuffled) {
      await this.fundWalletWithHops(masterKeypair, wallet, amount, 2);

      // Random delay between fundings (5-30 seconds)
      await new Promise(resolve => setTimeout(resolve, 5000 + Math.random() * 25000));
    }
  }

  getIntermediaryAddresses(): string[] {
    return this.intermediaryWallets.map(kp => kp.publicKey.toBase58());
  }
}

// Export all classes
export const createAntiDetectionEngine = (connection: Connection) => {
  return {
    patternEngine: new TradePatternEngine(),
    sizer: new OrganicSizer(),
    timing: new TimingController(),
    funding: new FundingObfuscator(connection),
  };
};
