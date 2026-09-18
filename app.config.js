// Wraps app.json to vary the app's identity by environment, so dev/qa/prod
// builds can be installed side by side on the same device. Selected via
// APP_VARIANT, set per EAS build profile in eas.json (defaults to
// production for local `expo start`/`expo run:android` with no override).
const APP_VARIANT = process.env.APP_VARIANT ?? 'production';

const VARIANTS = {
  dev: {
    name: 'VIGIL (Dev)',
    android: { package: 'com.vigil.drowsiness.dev' },
    ios: { bundleIdentifier: 'com.vigil.drowsiness.dev' },
  },
  qa: {
    name: 'VIGIL (QA)',
    android: { package: 'com.vigil.drowsiness.qa' },
    ios: { bundleIdentifier: 'com.vigil.drowsiness.qa' },
  },
  production: {
    name: 'VIGIL',
    android: { package: 'com.vigil.drowsiness' },
    ios: { bundleIdentifier: 'com.vigil.drowsiness' },
  },
};

module.exports = ({ config }) => {
  const variant = VARIANTS[APP_VARIANT] ?? VARIANTS.production;

  return {
    ...config,
    name: variant.name,
    android: { ...config.android, package: variant.android.package },
    ios: { ...config.ios, bundleIdentifier: variant.ios.bundleIdentifier },
  };
};
