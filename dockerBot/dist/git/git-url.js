"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.composeAuthUrl = composeAuthUrl;
exports.stripCredentials = stripCredentials;
exports.urlHasCredentials = urlHasCredentials;
function composeAuthUrl(rawUrl, token) {
    const publicUrl = stripCredentials(rawUrl);
    if (!token)
        return { authUrl: publicUrl, publicUrl };
    let parsed;
    try {
        parsed = new URL(publicUrl);
    }
    catch {
        return { authUrl: rawUrl, publicUrl };
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return { authUrl: rawUrl, publicUrl };
    }
    const host = parsed.hostname.toLowerCase();
    let userInfo;
    if (host.endsWith('github.com')) {
        userInfo = `x-access-token:${token}`;
    }
    else if (host.endsWith('gitlab.com') || host.includes('gitlab')) {
        userInfo = `oauth2:${token}`;
    }
    else if (host.endsWith('bitbucket.org')) {
        userInfo = `x-token-auth:${token}`;
    }
    else {
        userInfo = `:${token}`;
    }
    parsed.username = '';
    parsed.password = '';
    const authUrl = `${parsed.protocol}//${userInfo}@${parsed.host}${parsed.pathname}${parsed.search}${parsed.hash}`;
    return { authUrl, publicUrl };
}
function stripCredentials(url) {
    try {
        const u = new URL(url);
        u.username = '';
        u.password = '';
        return u.toString();
    }
    catch {
        return url;
    }
}
function urlHasCredentials(url) {
    try {
        const u = new URL(url);
        return !!(u.username || u.password);
    }
    catch {
        return false;
    }
}
//# sourceMappingURL=git-url.js.map