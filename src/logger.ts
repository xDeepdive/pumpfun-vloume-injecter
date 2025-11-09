import fs from 'fs';
import path from 'path';

export interface TransactionLog {
    timestamp: number;
    date: string;
    wallet: string;
    tokenMint: string;
    type: 'buy' | 'sell' | 'combined';
    amount: number;
    signature?: string;
    success: boolean;
    error?: string;
    fee: number;
    slippage: number;
    executionTime: number;
}

export class TransactionLogger {
    private logFile: string;
    private logs: TransactionLog[] = [];

    constructor(logFile?: string) {
        const logDir = path.join(process.cwd(), 'logs');
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        this.logFile = logFile || path.join(logDir, 'transactions.json');
        this.loadLogs();
    }

    private loadLogs() {
        if (fs.existsSync(this.logFile)) {
            try {
                const data = fs.readFileSync(this.logFile, 'utf-8');
                this.logs = JSON.parse(data);
            } catch (error) {
                console.error('Failed to load transaction logs:', error);
                this.logs = [];
            }
        }
    }

    private saveLogs() {
        try {
            fs.writeFileSync(this.logFile, JSON.stringify(this.logs, null, 2));
        } catch (error) {
            console.error('Failed to save transaction logs:', error);
        }
    }

    log(transaction: TransactionLog) {
        this.logs.push(transaction);
        this.saveLogs();
    }

    getLogs(filter?: {
        wallet?: string;
        tokenMint?: string;
        success?: boolean;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
    }): TransactionLog[] {
        let filtered = [...this.logs];

        if (filter?.wallet) {
            filtered = filtered.filter(log => log.wallet.includes(filter.wallet!));
        }

        if (filter?.tokenMint) {
            filtered = filtered.filter(log => log.tokenMint === filter.tokenMint);
        }

        if (filter?.success !== undefined) {
            filtered = filtered.filter(log => log.success === filter.success);
        }

        if (filter?.startDate) {
            filtered = filtered.filter(log => new Date(log.date) >= filter.startDate!);
        }

        if (filter?.endDate) {
            filtered = filtered.filter(log => new Date(log.date) <= filter.endDate!);
        }

        // Sort by timestamp descending (newest first)
        filtered.sort((a, b) => b.timestamp - a.timestamp);

        if (filter?.limit) {
            filtered = filtered.slice(0, filter.limit);
        }

        return filtered;
    }

    getStats(filter?: {
        tokenMint?: string;
        startDate?: Date;
        endDate?: Date;
    }) {
        const logs = this.getLogs(filter);

        const successful = logs.filter(l => l.success);
        const failed = logs.filter(l => !l.success);

        const totalVolume = successful.reduce((sum, log) => sum + log.amount, 0);
        const totalFees = successful.reduce((sum, log) => sum + log.fee, 0);
        const avgExecutionTime = successful.length > 0
            ? successful.reduce((sum, log) => sum + log.executionTime, 0) / successful.length
            : 0;

        return {
            total: logs.length,
            successful: successful.length,
            failed: failed.length,
            successRate: logs.length > 0 ? (successful.length / logs.length) * 100 : 0,
            totalVolume,
            totalFees,
            avgExecutionTime,
            avgFeePerTx: successful.length > 0 ? totalFees / successful.length : 0,
        };
    }

    exportToCSV(filename: string, filter?: Parameters<typeof this.getLogs>[0]) {
        const logs = this.getLogs(filter);
        const csv = [
            'Timestamp,Date,Wallet,Token,Type,Amount,Signature,Success,Fee,Slippage,ExecutionTime,Error',
            ...logs.map(log => [
                log.timestamp,
                log.date,
                log.wallet,
                log.tokenMint,
                log.type,
                log.amount,
                log.signature || '',
                log.success,
                log.fee,
                log.slippage,
                log.executionTime,
                log.error || ''
            ].join(','))
        ].join('\n');

        fs.writeFileSync(filename, csv);
        return filename;
    }

    clear() {
        this.logs = [];
        this.saveLogs();
    }
}

export const logger = new TransactionLogger();
