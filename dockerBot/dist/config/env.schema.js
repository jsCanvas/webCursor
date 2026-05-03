"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.envSchema = void 0;
exports.validateEnv = validateEnv;
const zod_1 = require("zod");
exports.envSchema = zod_1.z.object({
    PORT: zod_1.z.coerce.number().int().positive().default(8080),
    PHONEBOT_ENCRYPTION_KEY: zod_1.z
        .string()
        .regex(/^[0-9a-fA-F]{64}$/, 'PHONEBOT_ENCRYPTION_KEY must be 64 hex chars (32 bytes)'),
    PHONEBOT_DATA_DIR: zod_1.z.string().min(1).default('./data'),
    PHONEBOT_SANDBOX_CONTAINER: zod_1.z.string().min(1).default('phonebot-agent'),
    PHONEBOT_SANDBOX_WORKDIR_BASE: zod_1.z.string().min(1).default('/workspace'),
    PHONEBOT_BASE_DOMAIN: zod_1.z.string().min(1).default('localhost'),
    PHONEBOT_PROFILE: zod_1.z.enum(['local', 'production']).default('local'),
    PHONEBOT_MAX_CONCURRENT_RUNS: zod_1.z.coerce.number().int().positive().default(2),
    ACME_EMAIL: zod_1.z.string().email().optional(),
});
function validateEnv(raw) {
    const parsed = exports.envSchema.safeParse(raw);
    if (!parsed.success) {
        const issues = parsed.error.issues
            .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
            .join('\n');
        throw new Error(`Invalid environment configuration:\n${issues}`);
    }
    return parsed.data;
}
//# sourceMappingURL=env.schema.js.map