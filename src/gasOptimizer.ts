import { Connection, PublicKey, TransactionInstruction, ComputeBudgetProgram } from "@solana/web3.js";

export interface GasOptimizationConfig {
    priorityLevel: 'low' | 'medium' | 'high' | 'veryHigh' | 'auto';
    maxPriorityFee?: number; // in microLamports
    computeUnitLimit?: number;
    dynamicAdjustment?: boolean;
}

export interface FeeEstimate {
    computeUnitPrice: number;
    computeUnitLimit: number;
    estimatedFee: number;
    percentile: number;
    recommendedLevel: 'low' | 'medium' | 'high' | 'veryHigh';
}

export class GasOptimizer {
    private connection: Connection;
    private recentFees: number[] = [];
    private readonly MAX_HISTORY = 50;
    private lastUpdate: number = 0;
    private readonly UPDATE_INTERVAL = 30000; // 30 seconds

    // Priority fee ranges (in microLamports per compute unit)
    private readonly FEE_LEVELS = {
        low: 1000,        // 0.000001 SOL per CU
        medium: 10000,    // 0.00001 SOL per CU
        high: 50000,      // 0.00005 SOL per CU
        veryHigh: 100000, // 0.0001 SOL per CU
    };

    // Standard compute unit limits for different operations
    private readonly COMPUTE_LIMITS = {
        simple: 200_000,
        standard: 400_000,
        complex: 800_000,
        veryComplex: 1_200_000,
    };

    constructor(connection: Connection) {
        this.connection = connection;
    }

    /**
     * Get priority fee instructions based on configuration
     */
    async getPriorityFeeInstructions(
        config: GasOptimizationConfig
    ): Promise<TransactionInstruction[]> {
        const instructions: TransactionInstruction[] = [];

        // Determine compute unit price
        let computeUnitPrice: number;

        if (config.priorityLevel === 'auto') {
            computeUnitPrice = await this.getRecommendedPriorityFee();
        } else {
            computeUnitPrice = this.FEE_LEVELS[config.priorityLevel];
        }

        // Apply max cap if specified
        if (config.maxPriorityFee) {
            computeUnitPrice = Math.min(computeUnitPrice, config.maxPriorityFee);
        }

        // Determine compute unit limit
        const computeUnitLimit = config.computeUnitLimit || this.COMPUTE_LIMITS.complex;

        // Add compute budget instructions
        instructions.push(
            ComputeBudgetProgram.setComputeUnitLimit({ units: computeUnitLimit })
        );

        instructions.push(
            ComputeBudgetProgram.setComputeUnitPrice({ microLamports: computeUnitPrice })
        );

        return instructions;
    }

    /**
     * Get recommended priority fee based on recent network activity
     */
    private async getRecommendedPriorityFee(): Promise<number> {
        // Update fee history if needed
        if (Date.now() - this.lastUpdate > this.UPDATE_INTERVAL) {
            await this.updateFeeHistory();
        }

        if (this.recentFees.length === 0) {
            return this.FEE_LEVELS.medium; // Default to medium
        }

        // Calculate percentiles
        const sorted = [...this.recentFees].sort((a, b) => a - b);
        const p50 = sorted[Math.floor(sorted.length * 0.5)];
        const p75 = sorted[Math.floor(sorted.length * 0.75)];
        const p90 = sorted[Math.floor(sorted.length * 0.9)];

        // Recommend based on 75th percentile for good confirmation speed
        if (p75 < this.FEE_LEVELS.low) return this.FEE_LEVELS.low;
        if (p75 < this.FEE_LEVELS.medium) return this.FEE_LEVELS.medium;
        if (p75 < this.FEE_LEVELS.high) return this.FEE_LEVELS.high;
        return this.FEE_LEVELS.veryHigh;
    }

    /**
     * Update recent fee history from network
     */
    private async updateFeeHistory(): Promise<void> {
        try {
            // Get recent block with transactions
            const slot = await this.connection.getSlot('confirmed');
            const block = await this.connection.getBlock(slot, {
                maxSupportedTransactionVersion: 0,
            });

            if (!block || !block.transactions) {
                return;
            }

            // Extract priority fees from recent transactions
            const fees: number[] = [];

            for (const tx of block.transactions.slice(0, 50)) {
                if (!tx.meta || !tx.transaction) continue;

                // Look for compute budget instructions
                const instructions = tx.transaction.message.compiledInstructions ||
                                   (tx.transaction as any).message?.instructions || [];

                for (const ix of instructions) {
                    // ComputeBudget program ID
                    const programIdIndex = typeof ix.programIdIndex === 'number'
                        ? ix.programIdIndex
                        : (ix as any).programId;

                    if (programIdIndex === undefined) continue;

                    // Try to extract fee information (simplified)
                    // In a real implementation, you'd decode the instruction data
                    if (tx.meta.fee > 5000) {
                        const estimatedPriorityFee = (tx.meta.fee - 5000) / 200000; // Rough estimate
                        if (estimatedPriorityFee > 0) {
                            fees.push(Math.floor(estimatedPriorityFee));
                        }
                    }
                }
            }

            if (fees.length > 0) {
                this.recentFees = [...this.recentFees, ...fees].slice(-this.MAX_HISTORY);
                this.lastUpdate = Date.now();
            }

        } catch (error) {
            console.error('Failed to update fee history:', error);
        }
    }

    /**
     * Estimate transaction fee
     */
    async estimateFee(
        config: GasOptimizationConfig
    ): Promise<FeeEstimate> {
        const instructions = await this.getPriorityFeeInstructions(config);

        let computeUnitPrice = 0;
        let computeUnitLimit = 0;

        for (const ix of instructions) {
            // Extract values from instructions (simplified)
            // In reality, you'd decode the instruction data properly
            if (ix.programId.equals(ComputeBudgetProgram.programId)) {
                // This is a rough estimation
                const data = ix.data;
                if (data.length >= 5) {
                    const view = new DataView(data.buffer);
                    const discriminator = data[0];

                    if (discriminator === 3) { // SetComputeUnitPrice
                        computeUnitPrice = Number(view.getBigUint64(1, true));
                    } else if (discriminator === 2) { // SetComputeUnitLimit
                        computeUnitLimit = view.getUint32(1, true);
                    }
                }
            }
        }

        const estimatedFee = (computeUnitPrice * computeUnitLimit) / 1_000_000; // Convert to lamports

        // Determine percentile and recommendation
        let percentile = 50;
        let recommendedLevel: 'low' | 'medium' | 'high' | 'veryHigh' = 'medium';

        if (this.recentFees.length > 0) {
            const sorted = [...this.recentFees].sort((a, b) => a - b);
            const position = sorted.findIndex(f => f >= computeUnitPrice);
            percentile = position >= 0 ? (position / sorted.length) * 100 : 100;

            if (percentile < 25) recommendedLevel = 'low';
            else if (percentile < 50) recommendedLevel = 'medium';
            else if (percentile < 75) recommendedLevel = 'high';
            else recommendedLevel = 'veryHigh';
        }

        return {
            computeUnitPrice,
            computeUnitLimit,
            estimatedFee,
            percentile,
            recommendedLevel,
        };
    }

    /**
     * Get network congestion level
     */
    async getNetworkCongestion(): Promise<{
        level: 'low' | 'medium' | 'high' | 'veryHigh';
        tps: number;
        averageFee: number;
        recommendation: string;
    }> {
        try {
            const perfSamples = await this.connection.getRecentPerformanceSamples(1);
            const tps = perfSamples[0]?.numTransactions / perfSamples[0]?.samplePeriodSecs || 0;

            let level: 'low' | 'medium' | 'high' | 'veryHigh' = 'medium';
            let recommendation = 'Normal network conditions';

            if (tps < 1000) {
                level = 'low';
                recommendation = 'Low congestion - use low priority fees';
            } else if (tps < 2500) {
                level = 'medium';
                recommendation = 'Moderate congestion - use medium priority fees';
            } else if (tps < 3500) {
                level = 'high';
                recommendation = 'High congestion - use high priority fees';
            } else {
                level = 'veryHigh';
                recommendation = 'Very high congestion - use maximum priority fees';
            }

            const averageFee = this.recentFees.length > 0
                ? this.recentFees.reduce((a, b) => a + b, 0) / this.recentFees.length
                : this.FEE_LEVELS.medium;

            return {
                level,
                tps: Math.round(tps),
                averageFee: Math.round(averageFee),
                recommendation,
            };

        } catch (error) {
            console.error('Failed to get network congestion:', error);
            return {
                level: 'medium',
                tps: 0,
                averageFee: this.FEE_LEVELS.medium,
                recommendation: 'Unable to determine network conditions',
            };
        }
    }

    /**
     * Optimize compute unit limit based on transaction type
     */
    getOptimalComputeLimit(transactionType: 'buy' | 'sell' | 'combined'): number {
        switch (transactionType) {
            case 'buy':
                return this.COMPUTE_LIMITS.standard;
            case 'sell':
                return this.COMPUTE_LIMITS.standard;
            case 'combined':
                return this.COMPUTE_LIMITS.complex;
            default:
                return this.COMPUTE_LIMITS.standard;
        }
    }

    /**
     * Calculate savings from optimization
     */
    calculateSavings(
        withOptimization: FeeEstimate,
        withoutOptimization: FeeEstimate
    ): {
        savingsLamports: number;
        savingsSOL: number;
        savingsPercent: number;
    } {
        const diff = withoutOptimization.estimatedFee - withOptimization.estimatedFee;
        const percent = withoutOptimization.estimatedFee > 0
            ? (diff / withoutOptimization.estimatedFee) * 100
            : 0;

        return {
            savingsLamports: Math.round(diff),
            savingsSOL: diff / 1_000_000_000,
            savingsPercent: Math.round(percent * 100) / 100,
        };
    }

    /**
     * Get current fee statistics
     */
    getFeeStats(): {
        min: number;
        max: number;
        avg: number;
        median: number;
        p75: number;
        p90: number;
        sampleSize: number;
    } {
        if (this.recentFees.length === 0) {
            return {
                min: 0,
                max: 0,
                avg: 0,
                median: 0,
                p75: 0,
                p90: 0,
                sampleSize: 0,
            };
        }

        const sorted = [...this.recentFees].sort((a, b) => a - b);
        const sum = sorted.reduce((a, b) => a + b, 0);

        return {
            min: sorted[0],
            max: sorted[sorted.length - 1],
            avg: Math.round(sum / sorted.length),
            median: sorted[Math.floor(sorted.length * 0.5)],
            p75: sorted[Math.floor(sorted.length * 0.75)],
            p90: sorted[Math.floor(sorted.length * 0.9)],
            sampleSize: sorted.length,
        };
    }

    /**
     * Clear fee history
     */
    clearHistory(): void {
        this.recentFees = [];
        this.lastUpdate = 0;
    }

    /**
     * Get recommended configuration based on network conditions
     */
    async getRecommendedConfig(): Promise<GasOptimizationConfig> {
        const congestion = await this.getNetworkCongestion();

        const levelMap = {
            'low': 'low' as const,
            'medium': 'medium' as const,
            'high': 'high' as const,
            'veryHigh': 'veryHigh' as const,
        };

        return {
            priorityLevel: levelMap[congestion.level],
            computeUnitLimit: this.COMPUTE_LIMITS.complex,
            dynamicAdjustment: true,
        };
    }
}

// Export singleton instance creator
export function createGasOptimizer(connection: Connection): GasOptimizer {
    return new GasOptimizer(connection);
}
