const fs = require('node:fs');
const path = require('node:path');
const { notarize } = require('@electron/notarize');

function readEnv(name) {
  const value = process.env[name];
  return typeof value === 'string' ? value.trim() : '';
}

function getNotarizeOptions(appPath) {
  const keychainProfile = readEnv('APPLE_KEYCHAIN_PROFILE');
  if (keychainProfile) {
    return {
      tool: 'notarytool',
      appPath,
      keychainProfile,
    };
  }

  const appleApiKey = readEnv('APPLE_API_KEY');
  const appleApiKeyId = readEnv('APPLE_API_KEY_ID');
  const appleApiIssuer = readEnv('APPLE_API_ISSUER');
  if (appleApiKey && appleApiKeyId && appleApiIssuer) {
    return {
      tool: 'notarytool',
      appPath,
      appleApiKey,
      appleApiKeyId,
      appleApiIssuer,
    };
  }

  const appleId = readEnv('APPLE_ID');
  const appleIdPassword = readEnv('APPLE_APP_SPECIFIC_PASSWORD');
  const teamId = readEnv('APPLE_TEAM_ID');
  if (appleId && appleIdPassword && teamId) {
    return {
      tool: 'notarytool',
      appPath,
      appleId,
      appleIdPassword,
      teamId,
    };
  }

  return null;
}

exports.default = async function notarizeMacApp(context) {
  const { electronPlatformName, appOutDir, packager } = context;
  if (electronPlatformName !== 'darwin') {
    return;
  }

  if (readEnv('SKIP_STAKEOS_NOTARIZE') === '1') {
    console.log('[stakeos] Skipping notarization because SKIP_STAKEOS_NOTARIZE=1');
    return;
  }

  const appName = packager.appInfo.productFilename;
  const appPath = path.join(appOutDir, `${appName}.app`);
  if (!fs.existsSync(appPath)) {
    console.log(`[stakeos] Skipping notarization because ${appPath} does not exist.`);
    return;
  }

  const options = getNotarizeOptions(appPath);
  if (!options) {
    console.log('[stakeos] Skipping notarization because no Apple notarization credentials are configured.');
    return;
  }

  console.log(`[stakeos] Notarizing ${appName}.app with notarytool...`);
  await notarize(options);
  console.log('[stakeos] Notarization completed.');
};
