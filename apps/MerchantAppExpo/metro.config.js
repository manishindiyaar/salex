const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.alias = {
  '@theme/config': path.resolve(__dirname, 'src/theme/config'),
  '@components': path.resolve(__dirname, 'src/components'),
  '@services': path.resolve(__dirname, 'src/services'),
  '@screens': path.resolve(__dirname, 'src/screens'),
  '@store': path.resolve(__dirname, 'src/store'),
  '@navigation': path.resolve(__dirname, 'src/navigation'),
  '@context': path.resolve(__dirname, 'src/context'),
  '@': path.resolve(__dirname, 'src'),
};

// Enable symlinks for monorepo support
config.resolver.unstable_enableSymlinks = true;

module.exports = config;