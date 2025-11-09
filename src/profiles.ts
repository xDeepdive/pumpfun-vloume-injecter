import fs from 'fs';
import path from 'path';

export interface TokenProfile {
    name: string;
    tokenMint: string;
    interval: number;
    slippage: number;
    minPercent: number;
    maxPercent: number;
    autoRefund: boolean;
    refundThreshold: number;
    targetVolume?: number;
    maxBudget?: number;
    smartSlippage: boolean;
    targetSuccessRate?: number;
    createdAt: string;
    lastUsed?: string;
}

export class ProfileManager {
    private profilesFile: string;
    private profiles: Map<string, TokenProfile> = new Map();

    constructor() {
        const configDir = path.join(process.cwd(), '.pumpfun-config');
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
        }
        this.profilesFile = path.join(configDir, 'profiles.json');
        this.loadProfiles();
    }

    private loadProfiles() {
        if (fs.existsSync(this.profilesFile)) {
            try {
                const data = fs.readFileSync(this.profilesFile, 'utf-8');
                const profiles = JSON.parse(data);
                this.profiles = new Map(Object.entries(profiles));
            } catch (error) {
                console.error('Failed to load profiles:', error);
                this.profiles = new Map();
            }
        }
    }

    private saveProfiles() {
        try {
            const obj = Object.fromEntries(this.profiles);
            fs.writeFileSync(this.profilesFile, JSON.stringify(obj, null, 2));
        } catch (error) {
            console.error('Failed to save profiles:', error);
        }
    }

    save(profile: TokenProfile) {
        profile.lastUsed = new Date().toISOString();
        this.profiles.set(profile.name, profile);
        this.saveProfiles();
    }

    get(name: string): TokenProfile | undefined {
        return this.profiles.get(name);
    }

    list(): TokenProfile[] {
        return Array.from(this.profiles.values());
    }

    delete(name: string): boolean {
        const deleted = this.profiles.delete(name);
        if (deleted) {
            this.saveProfiles();
        }
        return deleted;
    }

    exists(name: string): boolean {
        return this.profiles.has(name);
    }
}

export const profileManager = new ProfileManager();
