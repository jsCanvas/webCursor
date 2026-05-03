"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComposeTemplateService = void 0;
const common_1 = require("@nestjs/common");
const YAML = __importStar(require("yaml"));
const PHONEBOT_NETWORK = 'phonebot-traefik';
let ComposeTemplateService = class ComposeTemplateService {
    generateForDockerfile(input) {
        const labels = this.buildTraefikLabels(input);
        const doc = {
            services: {
                app: {
                    build: { context: '.' },
                    restart: 'unless-stopped',
                    networks: [PHONEBOT_NETWORK, 'default'],
                    labels,
                    expose: [String(input.port)],
                },
            },
            networks: {
                [PHONEBOT_NETWORK]: { external: true },
                default: { driver: 'bridge' },
            },
        };
        return YAML.stringify(doc);
    }
    patchExistingCompose(yamlIn, input) {
        const doc = YAML.parse(yamlIn);
        if (!doc || typeof doc !== 'object') {
            throw new Error('Compose file is not a valid YAML map');
        }
        doc.networks = doc.networks ?? {};
        const networks = doc.networks;
        networks[PHONEBOT_NETWORK] = { external: true };
        if (!networks.default)
            networks.default = { driver: 'bridge' };
        const services = doc.services ?? {};
        const targetService = this.findRoutableService(services, input);
        if (targetService) {
            const labels = this.buildTraefikLabels(input);
            targetService.networks = uniq([
                ...(toArray(targetService.networks) ?? []),
                PHONEBOT_NETWORK,
                'default',
            ]);
            targetService.labels = mergeLabels(targetService.labels, labels);
        }
        return YAML.stringify(doc);
    }
    findRoutableService(services, input) {
        const preferredNames = ['app', 'frontend', 'web', 'client'];
        for (const name of preferredNames) {
            const service = services[name];
            if (service && typeof service === 'object')
                return service;
        }
        for (const service of Object.values(services)) {
            if (!service || typeof service !== 'object')
                continue;
            const candidate = service;
            if (servicePublishesPort(candidate, input.port))
                return candidate;
        }
        return undefined;
    }
    buildTraefikLabels(input) {
        const host = `${input.slug}.${input.baseDomain}`;
        const out = [
            `traefik.enable=true`,
            `traefik.docker.network=${PHONEBOT_NETWORK}`,
            `traefik.http.routers.${input.slug}.rule=Host(\`${host}\`)`,
            `traefik.http.routers.${input.slug}.entrypoints=${input.profile === 'production' ? 'websecure' : 'web'}`,
            `traefik.http.services.${input.slug}.loadbalancer.server.port=${input.port}`,
        ];
        if (input.profile === 'production') {
            out.push(`traefik.http.routers.${input.slug}.tls.certresolver=le`);
        }
        return out;
    }
};
exports.ComposeTemplateService = ComposeTemplateService;
exports.ComposeTemplateService = ComposeTemplateService = __decorate([
    (0, common_1.Injectable)()
], ComposeTemplateService);
function toArray(v) {
    if (Array.isArray(v))
        return v;
    if (typeof v === 'string')
        return [v];
    return undefined;
}
function uniq(arr) {
    return Array.from(new Set(arr));
}
function mergeLabels(existing, added) {
    const cur = toArray(existing) ?? [];
    const seenKeys = new Set();
    for (const l of added)
        seenKeys.add(l.split('=')[0]);
    const filtered = cur.filter((l) => !seenKeys.has(l.split('=')[0]));
    return [...filtered, ...added];
}
function servicePublishesPort(service, port) {
    const ports = toArray(service.ports) ?? [];
    return ports.some((entry) => {
        const parts = String(entry).split(':');
        return parts[parts.length - 1] === String(port);
    });
}
//# sourceMappingURL=compose-template.service.js.map