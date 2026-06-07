module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@theme/config': './src/theme/config',
            '@components': './src/components',
            '@services': './src/services',
            '@screens': './src/screens',
            '@store': './src/store',
            '@navigation': './src/navigation',
            '@context': './src/context',
            '@': './src',
            '@salex/shared-types': '../../packages/shared-types/src'
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};