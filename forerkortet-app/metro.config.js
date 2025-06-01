const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Enable platform-specific extensions for TypeScript
config.resolver.sourceExts = [...config.resolver.sourceExts, 'ts', 'tsx'];

// config.resolver.sourceExts.push("cjs");
// config.resolver.unstable_enablePackageExports = false;

module.exports = config;
