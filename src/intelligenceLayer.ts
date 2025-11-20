/**
 * Intelligence Layer Module
 * Features: Signature obfuscation, Mayhem mode, AI personalities, network diversity, social sentiment
 */

import { Connection, TransactionInstruction, ComputeBudgetProgram } from '@solana/web3.js';
import axios from 'axios';

// Feature 7: Signature Obfuscation
export class SignatureObfuscator {
  private memoProgram = new Uint8Array([
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ]);

  // Add random memo to transactions (looks organic)
  addRandomMemo(): TransactionInstruction | null {
    if (Math.random() < 0.3) {
      // 30% chance to add memo
      const memos = [
        'gm',
        'lfg',
        'moon',
        'hold',
        'buy dip',
        'ngmi',
        'wagmi',
        'dyor',
        'nfa',
        'bullish',
      ];
      const memo = memos[Math.floor(Math.random() * memos.length)];

      // In production, you'd use the actual memo program
      // For now, return null to avoid dependencies
      return null;
    }
    return null;
  }

  // Add compute budget variance (prevents identical signatures)
  addComputeBudgetVariance(): TransactionInstruction[] {
    const instructions: TransactionInstruction[] = [];

    // Random compute units (250k - 400k)
    const computeUnits = 250000 + Math.floor(Math.random() * 150000);
    instructions.push(
      ComputeBudgetProgram.setComputeUnitLimit({
        units: computeUnits,
      })
    );

    // Random priority fee (varies by ±20%)
    const baseFee = 1000;
    const variation = 0.8 + Math.random() * 0.4; // 0.8x - 1.2x
    const priorityFee = Math.floor(baseFee * variation);

    instructions.push(
      ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: priorityFee,
      })
    );

    return instructions;
  }

  // Add timing jitter to prevent pattern detection
  getTimingJitter(baseDelay: number): number {
    // Add ±30% random jitter
    const jitter = baseDelay * (0.7 + Math.random() * 0.6);
    return Math.floor(jitter);
  }

  // Generate transaction with unique fingerprint
  generateUniqueFingerprint(): {
    computeUnits: number;
    priorityFee: number;
    memo: string | null;
    delay: number;
  } {
    const memos = ['gm', 'lfg', 'wagmi', null, null, null]; // 50% no memo

    return {
      computeUnits: 250000 + Math.floor(Math.random() * 150000),
      priorityFee: 500 + Math.floor(Math.random() * 2000),
      memo: memos[Math.floor(Math.random() * memos.length)],
      delay: Math.floor(1000 + Math.random() * 2000),
    };
  }
}

// Feature 9: Mayhem Mode (24h aggressive volume)
export class MayhemMode {
  private active = false;
  private startTime = 0;
  private duration = 24 * 60 * 60 * 1000; // 24 hours
  private targetVolume = 0;
  private currentVolume = 0;

  activate(targetVolumeSOL: number) {
    this.active = true;
    this.startTime = Date.now();
    this.targetVolume = targetVolumeSOL;
    this.currentVolume = 0;
    console.log(`\n🔥 MAYHEM MODE ACTIVATED 🔥`);
    console.log(`   Target: ${targetVolumeSOL} SOL in 24 hours`);
    console.log(`   Strategy: 50/50 buy/sell, exponential decay\n`);
  }

  isActive(): boolean {
    if (!this.active) return false;

    // Check if 24h expired
    if (Date.now() - this.startTime > this.duration) {
      this.deactivate();
      return false;
    }

    // Check if target reached
    if (this.currentVolume >= this.targetVolume) {
      console.log(`✅ Mayhem mode target reached: ${this.currentVolume.toFixed(2)} SOL`);
      this.deactivate();
      return false;
    }

    return true;
  }

  deactivate() {
    this.active = false;
    console.log(`\n🏁 MAYHEM MODE COMPLETED`);
    console.log(`   Volume generated: ${this.currentVolume.toFixed(2)} SOL`);
    console.log(`   Duration: ${((Date.now() - this.startTime) / 3600000).toFixed(1)} hours\n`);
  }

  // Get interval for mayhem mode (starts fast, slows down)
  getInterval(baseInterval: number): number {
    if (!this.active) return baseInterval;

    const elapsed = Date.now() - this.startTime;
    const progress = elapsed / this.duration;

    // Exponential decay: starts at 50% speed, ends at 150% speed
    const multiplier = 0.5 + (progress * 1.0);
    return Math.floor(baseInterval * multiplier);
  }

  // Mayhem mode uses 50/50 buy/sell ratio
  shouldBuy(): boolean {
    return Math.random() < 0.5;
  }

  recordVolume(volumeSOL: number) {
    this.currentVolume += volumeSOL;
  }

  getProgress(): {
    active: boolean;
    progress: number;
    volume: number;
    target: number;
    timeLeft: string;
  } {
    const timeLeft = this.duration - (Date.now() - this.startTime);
    const hoursLeft = Math.max(0, timeLeft / 3600000);

    return {
      active: this.active,
      progress: (this.currentVolume / this.targetVolume) * 100,
      volume: this.currentVolume,
      target: this.targetVolume,
      timeLeft: `${hoursLeft.toFixed(1)}h`,
    };
  }
}

// Feature 10: AI Agent Personalities
export enum AgentPersonality {
  DEGEN = 'degen',           // High risk, fast trades, YOLO
  SCALPER = 'scalper',       // Quick in/out, small profits
  SWING = 'swing',           // Medium holds, trend following
  HODLER = 'hodler',         // Long holds, patient
  WHALE = 'whale',           // Large positions, slow moves
  PAPER_HANDS = 'paper_hands', // Quick exits, fearful
  DIAMOND_HANDS = 'diamond_hands', // Never sells, always buys
}

export interface PersonalityTraits {
  avgHoldTime: number;      // seconds
  riskTolerance: number;    // 0-1
  tradeFrequency: number;   // trades per hour
  avgTradeSize: number;     // % of balance
  panicSellChance: number;  // 0-1
  fomoBuyChance: number;    // 0-1
}

export class AIAgentPersonality {
  private personality: AgentPersonality;
  private traits: PersonalityTraits;

  constructor(personality?: AgentPersonality) {
    this.personality = personality || this.selectRandomPersonality();
    this.traits = this.getTraitsForPersonality(this.personality);
    console.log(`🤖 AI Agent spawned: ${this.personality.toUpperCase()}`);
  }

  private selectRandomPersonality(): AgentPersonality {
    const personalities = Object.values(AgentPersonality);
    return personalities[Math.floor(Math.random() * personalities.length)];
  }

  private getTraitsForPersonality(personality: AgentPersonality): PersonalityTraits {
    switch (personality) {
      case AgentPersonality.DEGEN:
        return {
          avgHoldTime: 120,      // 2 minutes
          riskTolerance: 1.0,
          tradeFrequency: 30,    // 30 trades/hour
          avgTradeSize: 80,
          panicSellChance: 0.3,
          fomoBuyChance: 0.9,
        };

      case AgentPersonality.SCALPER:
        return {
          avgHoldTime: 300,      // 5 minutes
          riskTolerance: 0.6,
          tradeFrequency: 20,
          avgTradeSize: 40,
          panicSellChance: 0.5,
          fomoBuyChance: 0.4,
        };

      case AgentPersonality.SWING:
        return {
          avgHoldTime: 1800,     // 30 minutes
          riskTolerance: 0.7,
          tradeFrequency: 5,
          avgTradeSize: 60,
          panicSellChance: 0.3,
          fomoBuyChance: 0.5,
        };

      case AgentPersonality.HODLER:
        return {
          avgHoldTime: 7200,     // 2 hours
          riskTolerance: 0.4,
          tradeFrequency: 2,
          avgTradeSize: 70,
          panicSellChance: 0.1,
          fomoBuyChance: 0.3,
        };

      case AgentPersonality.WHALE:
        return {
          avgHoldTime: 3600,     // 1 hour
          riskTolerance: 0.5,
          tradeFrequency: 3,
          avgTradeSize: 90,
          panicSellChance: 0.1,
          fomoBuyChance: 0.2,
        };

      case AgentPersonality.PAPER_HANDS:
        return {
          avgHoldTime: 180,      // 3 minutes
          riskTolerance: 0.3,
          tradeFrequency: 15,
          avgTradeSize: 50,
          panicSellChance: 0.8,
          fomoBuyChance: 0.6,
        };

      case AgentPersonality.DIAMOND_HANDS:
        return {
          avgHoldTime: 10800,    // 3 hours
          riskTolerance: 0.9,
          tradeFrequency: 1,
          avgTradeSize: 80,
          panicSellChance: 0.05,
          fomoBuyChance: 0.8,
        };

      default:
        return {
          avgHoldTime: 1800,
          riskTolerance: 0.5,
          tradeFrequency: 10,
          avgTradeSize: 50,
          panicSellChance: 0.3,
          fomoBuyChance: 0.5,
        };
    }
  }

  getTraits(): PersonalityTraits {
    return this.traits;
  }

  getPersonality(): string {
    return this.personality;
  }

  // Should this agent trade right now?
  shouldTrade(priceChange: number): boolean {
    // FOMO buying on pump
    if (priceChange > 10 && Math.random() < this.traits.fomoBuyChance) {
      return true;
    }

    // Panic selling on dump
    if (priceChange < -10 && Math.random() < this.traits.panicSellChance) {
      return true;
    }

    // Normal frequency check
    const hourlyChance = this.traits.tradeFrequency / 60; // per minute
    return Math.random() < hourlyChance;
  }

  // Get trade size based on personality
  getTradeSize(minPercent: number, maxPercent: number): number {
    const range = maxPercent - minPercent;
    const target = this.traits.avgTradeSize;

    // Add some variance (±20%)
    const variance = 0.8 + Math.random() * 0.4;
    const size = target * variance;

    return Math.max(minPercent, Math.min(maxPercent, size));
  }

  // Get hold time (how long before selling after buying)
  getHoldTime(): number {
    // Add variance (±50%)
    const variance = 0.5 + Math.random() * 1.0;
    return Math.floor(this.traits.avgHoldTime * variance * 1000); // convert to ms
  }
}

// Feature 13: Network Diversification
export class NetworkDiversifier {
  private rpcEndpoints: string[] = [];
  private walletRPCMap: Map<string, string> = new Map();
  private timezoneOffsets: number[] = [];

  constructor(rpcEndpoints: string[]) {
    this.rpcEndpoints = rpcEndpoints;
    this.generateTimezoneOffsets();
  }

  private generateTimezoneOffsets() {
    // Common timezone offsets (in hours)
    this.timezoneOffsets = [-8, -5, 0, 1, 8, 9]; // LA, NY, London, Paris, Singapore, Tokyo
  }

  // Assign unique RPC to each wallet
  assignRPCToWallet(walletAddress: string): string {
    if (this.walletRPCMap.has(walletAddress)) {
      return this.walletRPCMap.get(walletAddress)!;
    }

    const rpc = this.rpcEndpoints[Math.floor(Math.random() * this.rpcEndpoints.length)];
    this.walletRPCMap.set(walletAddress, rpc);
    return rpc;
  }

  // Get RPC for wallet
  getRPCForWallet(walletAddress: string): string {
    return this.walletRPCMap.get(walletAddress) || this.rpcEndpoints[0];
  }

  // Simulate timezone-aware trading (some wallets more active at certain hours)
  getTimezoneActivityMultiplier(walletAddress: string): number {
    const currentHour = new Date().getUTCHours();

    // Get assigned timezone for this wallet
    const hash = walletAddress.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const timezoneOffset = this.timezoneOffsets[hash % this.timezoneOffsets.length];

    const localHour = (currentHour + timezoneOffset + 24) % 24;

    // Peak activity 9am-11pm local time
    if (localHour >= 9 && localHour <= 23) {
      return 1.0 + (Math.random() * 0.5); // 1.0x - 1.5x
    } else {
      return 0.3 + (Math.random() * 0.4); // 0.3x - 0.7x (night)
    }
  }

  getStats() {
    return {
      rpcCount: this.rpcEndpoints.length,
      walletsAssigned: this.walletRPCMap.size,
      timezones: this.timezoneOffsets.length,
    };
  }
}

// Feature 14: Social Sentiment (simulated - in production, connect to Twitter API)
export class SocialSentiment {
  private sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  private lastUpdate = 0;
  private updateInterval = 300000; // 5 minutes

  async updateSentiment(tokenMint: string): Promise<void> {
    if (Date.now() - this.lastUpdate < this.updateInterval) {
      return;
    }

    try {
      // In production, fetch from Twitter/Telegram APIs
      // For now, simulate sentiment
      const sentiments: Array<'bullish' | 'bearish' | 'neutral'> = ['bullish', 'bearish', 'neutral'];
      this.sentiment = sentiments[Math.floor(Math.random() * sentiments.length)];
      this.lastUpdate = Date.now();

      console.log(`📱 Social sentiment updated: ${this.sentiment.toUpperCase()}`);
    } catch (error) {
      console.error('Failed to update sentiment:', error);
    }
  }

  // Sentiment affects trading decisions
  getSentimentMultiplier(): { buyChance: number; sellChance: number } {
    switch (this.sentiment) {
      case 'bullish':
        return { buyChance: 1.4, sellChance: 0.6 }; // More buys
      case 'bearish':
        return { buyChance: 0.6, sellChance: 1.4 }; // More sells
      case 'neutral':
      default:
        return { buyChance: 1.0, sellChance: 1.0 }; // Balanced
    }
  }

  getCurrentSentiment(): string {
    return this.sentiment;
  }

  // Simulate price alerts (triggers FOMO/panic)
  async checkPriceAlerts(currentPrice: number, previousPrice: number): Promise<{
    alert: boolean;
    type: 'pump' | 'dump' | null;
    message: string;
  }> {
    const change = ((currentPrice - previousPrice) / previousPrice) * 100;

    if (change > 20) {
      return {
        alert: true,
        type: 'pump',
        message: `🚨 PRICE ALERT: +${change.toFixed(1)}% pump detected!`,
      };
    }

    if (change < -20) {
      return {
        alert: true,
        type: 'dump',
        message: `🚨 PRICE ALERT: ${change.toFixed(1)}% dump detected!`,
      };
    }

    return { alert: false, type: null, message: '' };
  }
}

export const createIntelligenceLayer = (rpcEndpoints: string[]) => {
  return {
    signature: new SignatureObfuscator(),
    mayhem: new MayhemMode(),
    personality: AIAgentPersonality,
    network: new NetworkDiversifier(rpcEndpoints),
    sentiment: new SocialSentiment(),
  };
};
