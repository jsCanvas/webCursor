"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EncryptionService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
const ALGO = 'aes-256-gcm';
const IV_LEN = 12;
let EncryptionService = class EncryptionService {
    key;
    constructor(config) {
        const keyHex = config.get('PHONEBOT_ENCRYPTION_KEY', { infer: true });
        this.key = Buffer.from(keyHex, 'hex');
        if (this.key.length !== 32) {
            throw new Error('PHONEBOT_ENCRYPTION_KEY must decode to 32 bytes');
        }
    }
    encrypt(plain) {
        const iv = (0, crypto_1.randomBytes)(IV_LEN);
        const cipher = (0, crypto_1.createCipheriv)(ALGO, this.key, iv);
        const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
        const tag = cipher.getAuthTag();
        return `${iv.toString('base64')}.${tag.toString('base64')}.${ct.toString('base64')}`;
    }
    decrypt(token) {
        const parts = token.split('.');
        if (parts.length !== 3) {
            throw new Error('Invalid ciphertext format');
        }
        const [ivB64, tagB64, ctB64] = parts;
        const iv = Buffer.from(ivB64, 'base64');
        const tag = Buffer.from(tagB64, 'base64');
        const ct = Buffer.from(ctB64, 'base64');
        if (iv.length !== IV_LEN) {
            throw new Error('Invalid IV length');
        }
        const decipher = (0, crypto_1.createDecipheriv)(ALGO, this.key, iv);
        decipher.setAuthTag(tag);
        return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
    }
    safeEquals(a, b) {
        const ab = Buffer.from(a);
        const bb = Buffer.from(b);
        if (ab.length !== bb.length)
            return false;
        return (0, crypto_1.timingSafeEqual)(ab, bb);
    }
    static mask(secret) {
        if (secret.length <= 8)
            return '****';
        return `${secret.slice(0, 4)}…${secret.slice(-4)}`;
    }
};
exports.EncryptionService = EncryptionService;
exports.EncryptionService = EncryptionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EncryptionService);
//# sourceMappingURL=encryption.service.js.map