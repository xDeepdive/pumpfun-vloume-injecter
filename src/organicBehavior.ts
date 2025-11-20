/**
 * Organic Behavior Module
 * Features: Human behavior, failure simulation, P/L realism, wallet distribution
 */

// Feature 1: Human Behavior Simulation
export enum EmotionalState {
  NEUTRAL = 'neutral',
  FOMO = 'fomo',
  PANIC = 'panic',
  GREEDY = 'greedy',
  FEARFUL = 'fearful',
  CONFIDENT = 'confident',
}

export enum TradingSession {
  MORNING = 'morning',      // 6-12 UTC
  AFTERNOON = 'afternoon',  // 12-18 UTC
  EVENING = 'evening',      // 18-24 UTC
  NIGHT = 'night',          // 0-6 UTC
}

export class HumanBehaviorEngine {
  private emotionalState: EmotionalState = EmotionalState.NEUTRAL;
  private sessionActive = false;
  private sessionStartTime = 0;
  private sessionDuration = 0;
  private lastPriceChange = 0;

  constructor() {
    this.maybeStartSession();
  }

  getCurrentSession(): TradingSession {
    const hour = new Date().getUTCHours();
    if (hour >= 6 && hour < 12) return TradingSession.MORNING;
    if (hour >= 12 && hour < 18) return TradingSession.AFTERNOON;
    if (hour >= 18 && hour < 24) return TradingSession.EVENING;
    return TradingSession.NIGHT;
  }

  // Humans don't trade 24/7 - they have sessions
  maybeStartSession(): boolean {
    if (this.sessionActive) {
      // Check if session should end
      if (Date.now() - this.sessionStartTime > this.sessionDuration) {
        this.sessionActive = false;
        console.log(`😴 Trading session ended`);
        return false;
      }
      return true;
    }

    // Start new session (60% chance during day, 20% at night)
    const session = this.getCurrentSession();
    const sessionChance = session === TradingSession.NIGHT ? 0.2 : 0.6;

    if (Math.random() < sessionChance) {
      this.sessionActive = true;
      this.sessionStartTime = Date.now();
      // Session lasts 30 min - 4 hours
      this.sessionDuration = (30 + Math.random() * 210) * 60 * 1000;
      console.log(`💼 Trading session started (${(this.sessionDuration / 3600000).toFixed(1)}h)`);
      return true;
    }

    return false;
  }

  // Update emotional state based on price movement
  updateEmotionalState(priceChangePercent: number) {
    this.lastPriceChange = priceChangePercent;

    if (priceChangePercent > 15) {
      // Big pump = FOMO
      this.emotionalState = EmotionalState.FOMO;
      console.log(`😱 Emotional state: FOMO (price +${priceChangePercent.toFixed(1)}%)`);
    } else if (priceChangePercent < -15) {
      // Big dump = PANIC
      this.emotionalState = EmotionalState.PANIC;
      console.log(`😨 Emotional state: PANIC (price ${priceChangePercent.toFixed(1)}%)`);
    } else if (priceChangePercent > 5) {
      this.emotionalState = EmotionalState.GREEDY;
    } else if (priceChangePercent < -5) {
      this.emotionalState = EmotionalState.FEARFUL;
    } else {
      // Gradually return to neutral
      if (Math.random() < 0.3) {
        this.emotionalState = EmotionalState.NEUTRAL;
      }
    }
  }

  // Emotions affect trade decisions
  shouldTrade(): { trade: boolean; reason?: string } {
    if (!this.sessionActive) {
      return { trade: false, reason: 'Outside trading session' };
    }

    switch (this.emotionalState) {
      case EmotionalState.FOMO:
        // FOMO = 90% chance to trade (mostly buys)
        return { trade: Math.random() < 0.9, reason: 'FOMO buying' };

      case EmotionalState.PANIC:
        // PANIC = 80% chance to trade (mostly sells)
        return { trade: Math.random() < 0.8, reason: 'Panic selling' };

      case EmotionalState.GREEDY:
        // Greedy = 70% chance (wants more gains)
        return { trade: Math.random() < 0.7, reason: 'Greedy' };

      case EmotionalState.FEARFUL:
        // Fearful = 40% chance (hesitant)
        return { trade: Math.random() < 0.4, reason: 'Fearful' };

      case EmotionalState.CONFIDENT:
        // Confident = 80% chance
        return { trade: Math.random() < 0.8, reason: 'Confident' };

      case EmotionalState.NEUTRAL:
      default:
        // Neutral = 60% chance
        return { trade: Math.random() < 0.6, reason: 'Normal trading' };
    }
  }

  // Emotions affect trade size
  getEmotionalSizeMultiplier(): number {
    switch (this.emotionalState) {
      case EmotionalState.FOMO:
        return 1.3 + Math.random() * 0.4; // 1.3x - 1.7x (larger trades)
      case EmotionalState.PANIC:
        return 1.2 + Math.random() * 0.3; // 1.2x - 1.5x (larger sells)
      case EmotionalState.GREEDY:
        return 1.1 + Math.random() * 0.2; // 1.1x - 1.3x
      case EmotionalState.FEARFUL:
        return 0.5 + Math.random() * 0.3; // 0.5x - 0.8x (smaller trades)
      case EmotionalState.CONFIDENT:
        return 1.0 + Math.random() * 0.3; // 1.0x - 1.3x
      default:
        return 0.9 + Math.random() * 0.2; // 0.9x - 1.1x
    }
  }

  getState() {
    return {
      emotion: this.emotionalState,
      session: this.getCurrentSession(),
      active: this.sessionActive,
      priceChange: this.lastPriceChange,
    };
  }
}

// Feature 15: Failure Simulation (7% intentional failure)
export class FailureSimulator {
  private targetFailureRate = 0.07; // 7%
  private recentFailures: boolean[] = [];
  private maxHistory = 100;

  shouldSimulateFailure(): { fail: boolean; reason?: string } {
    // Track actual failure rate
    const currentRate = this.recentFailures.filter(f => f).length / Math.max(this.recentFailures.length, 1);

    // If we're below target, increase failure chance
    if (currentRate < this.targetFailureRate) {
      const failChance = 0.12; // 12% chance when below target
      if (Math.random() < failChance) {
        this.recordFailure(true);
        return {
          fail: true,
          reason: this.getRandomFailureReason()
        };
      }
    }

    this.recordFailure(false);
    return { fail: false };
  }

  private recordFailure(failed: boolean) {
    this.recentFailures.push(failed);
    if (this.recentFailures.length > this.maxHistory) {
      this.recentFailures.shift();
    }
  }

  private getRandomFailureReason(): string {
    const reasons = [
      'Slippage too high',
      'Changed mind',
      'Network congestion',
      'Insufficient balance',
      'Wrong price',
      'Manual cancellation',
      'Timing issue',
    ];
    return reasons[Math.floor(Math.random() * reasons.length)];
  }

  // After failure, humans retry (sometimes)
  shouldRetry(attempt: number): boolean {
    if (attempt === 1) return Math.random() < 0.6; // 60% retry once
    if (attempt === 2) return Math.random() < 0.3; // 30% retry twice
    return false; // Give up after 2 retries
  }

  getStats() {
    const totalTrades = this.recentFailures.length;
    const failures = this.recentFailures.filter(f => f).length;
    return {
      totalTrades,
      failures,
      failureRate: (failures / Math.max(totalTrades, 1) * 100).toFixed(2) + '%',
    };
  }
}

// Feature 17: Profit/Loss Realism (60% win rate, revenge trading)
export class ProfitLossTracker {
  private trades: Array<{ profit: number; timestamp: number }> = [];
  private winRate = 0.6; // Target 60% win rate
  private consecutiveLosses = 0;

  recordTrade(entryPrice: number, exitPrice: number, isBuy: boolean) {
    const profit = isBuy
      ? ((exitPrice - entryPrice) / entryPrice) * 100
      : ((entryPrice - exitPrice) / entryPrice) * 100;

    this.trades.push({
      profit,
      timestamp: Date.now(),
    });

    if (profit < 0) {
      this.consecutiveLosses++;
    } else {
      this.consecutiveLosses = 0;
    }

    // Keep last 100 trades
    if (this.trades.length > 100) {
      this.trades.shift();
    }
  }

  // After losses, humans "revenge trade" (trade more aggressively)
  shouldRevengeTrade(): boolean {
    if (this.consecutiveLosses >= 3) {
      console.log(`😡 Revenge trading activated (${this.consecutiveLosses} losses)`);
      return true;
    }
    return false;
  }

  // Revenge trading = higher frequency + larger sizes
  getRevengeTradingMultiplier(): { frequency: number; size: number } {
    if (!this.shouldRevengeTrade()) {
      return { frequency: 1.0, size: 1.0 };
    }

    return {
      frequency: 1.5 + (this.consecutiveLosses * 0.2), // 1.5x - 2.5x faster
      size: 1.2 + (this.consecutiveLosses * 0.15),      // 1.2x - 1.8x larger
    };
  }

  getCurrentWinRate(): number {
    if (this.trades.length === 0) return 0;
    const wins = this.trades.filter(t => t.profit > 0).length;
    return wins / this.trades.length;
  }

  getStats() {
    const wins = this.trades.filter(t => t.profit > 0).length;
    const losses = this.trades.filter(t => t.profit < 0).length;
    const totalProfit = this.trades.reduce((sum, t) => sum + t.profit, 0);

    return {
      totalTrades: this.trades.length,
      wins,
      losses,
      winRate: (wins / Math.max(this.trades.length, 1) * 100).toFixed(2) + '%',
      totalProfit: totalProfit.toFixed(2) + '%',
      consecutiveLosses: this.consecutiveLosses,
      revengeTradingActive: this.shouldRevengeTrade(),
    };
  }
}

// Feature 16: Wallet Distribution (whale/fish/shrimp/plankton)
export enum WalletTier {
  WHALE = 'whale',         // 1-2 wallets, 0.5-2 SOL each
  FISH = 'fish',           // 5-10 wallets, 0.1-0.5 SOL each
  SHRIMP = 'shrimp',       // 20-40 wallets, 0.02-0.1 SOL each
  PLANKTON = 'plankton',   // 50-100 wallets, 0.005-0.02 SOL each
}

export interface WalletDistribution {
  tier: WalletTier;
  count: number;
  minBalance: number;
  maxBalance: number;
}

export class WalletDistributor {
  static createRealisticDistribution(totalSOL: number): WalletDistribution[] {
    const distribution: WalletDistribution[] = [];

    // Allocate based on realistic market patterns
    const whaleAllocation = totalSOL * 0.4;   // 40% to whales
    const fishAllocation = totalSOL * 0.3;    // 30% to fish
    const shrimpAllocation = totalSOL * 0.2;  // 20% to shrimp
    const planktonAllocation = totalSOL * 0.1; // 10% to plankton

    // Whales: 1-2 large wallets
    const whaleCount = 1 + Math.floor(Math.random() * 2);
    distribution.push({
      tier: WalletTier.WHALE,
      count: whaleCount,
      minBalance: 0.5,
      maxBalance: whaleAllocation / whaleCount,
    });

    // Fish: 5-10 medium wallets
    const fishCount = 5 + Math.floor(Math.random() * 6);
    distribution.push({
      tier: WalletTier.FISH,
      count: fishCount,
      minBalance: 0.1,
      maxBalance: fishAllocation / fishCount,
    });

    // Shrimp: 20-40 small wallets
    const shrimpCount = 20 + Math.floor(Math.random() * 21);
    distribution.push({
      tier: WalletTier.SHRIMP,
      count: shrimpCount,
      minBalance: 0.02,
      maxBalance: shrimpAllocation / shrimpCount,
    });

    // Plankton: 50-100 tiny wallets
    const planktonCount = 50 + Math.floor(Math.random() * 51);
    distribution.push({
      tier: WalletTier.PLANKTON,
      count: planktonCount,
      minBalance: 0.005,
      maxBalance: planktonAllocation / planktonCount,
    });

    console.log(`\n🐋 Wallet Distribution Created:`);
    distribution.forEach(d => {
      console.log(`   ${d.tier.toUpperCase()}: ${d.count} wallets (${d.minBalance}-${d.maxBalance.toFixed(3)} SOL each)`);
    });

    return distribution;
  }

  static getTotalWalletCount(distribution: WalletDistribution[]): number {
    return distribution.reduce((sum, d) => sum + d.count, 0);
  }

  // Different tiers trade with different patterns
  static getTierBehavior(tier: WalletTier): {
    activityLevel: number;
    avgHoldTime: number;
    riskTolerance: number;
  } {
    switch (tier) {
      case WalletTier.WHALE:
        return {
          activityLevel: 0.3,  // Less frequent trading
          avgHoldTime: 3600,   // 1 hour average hold
          riskTolerance: 0.4,  // More conservative
        };
      case WalletTier.FISH:
        return {
          activityLevel: 0.6,  // Moderate trading
          avgHoldTime: 1800,   // 30 min average hold
          riskTolerance: 0.6,  // Balanced
        };
      case WalletTier.SHRIMP:
        return {
          activityLevel: 0.8,  // Active trading
          avgHoldTime: 600,    // 10 min average hold
          riskTolerance: 0.8,  // More risky
        };
      case WalletTier.PLANKTON:
        return {
          activityLevel: 0.9,  // Very active
          avgHoldTime: 300,    // 5 min average hold
          riskTolerance: 1.0,  // Degenerate
        };
    }
  }
}

export const createOrganicBehaviorEngine = () => {
  return {
    human: new HumanBehaviorEngine(),
    failure: new FailureSimulator(),
    profitLoss: new ProfitLossTracker(),
    distribution: WalletDistributor,
  };
};
