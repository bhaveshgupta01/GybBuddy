// Mock expo modules that aren't available in test environment
jest.mock('expo-location', () => ({}));
jest.mock('expo-sensors', () => ({ Pedometer: { isAvailableAsync: jest.fn(), watchStepCount: jest.fn(), getStepCountAsync: jest.fn() }, Accelerometer: { setUpdateInterval: jest.fn(), addListener: jest.fn() } }));
jest.mock('expo-av', () => ({ Audio: { requestPermissionsAsync: jest.fn(), setAudioModeAsync: jest.fn(), Recording: { createAsync: jest.fn() }, Sound: { createAsync: jest.fn() } } }));
jest.mock('expo-speech', () => ({ speak: jest.fn(), stop: jest.fn() }));
jest.mock('expo-file-system', () => ({ cacheDirectory: '/tmp/', readAsStringAsync: jest.fn(), writeAsStringAsync: jest.fn(), getInfoAsync: jest.fn(), deleteAsync: jest.fn() }));
jest.mock('@react-native-async-storage/async-storage', () => ({ getItem: jest.fn(), setItem: jest.fn() }));
