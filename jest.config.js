module.exports = {
  preset: 'jest-expo',
  // without this, reanimated tries to load its real native module under
  // jest and crashes (loadUnpackers error)
  resolver: 'react-native-worklets/jest/resolver',
  setupFiles: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|nativewind|react-native-css-interop|react-native-reanimated)',
  ],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.d.ts'],
};
