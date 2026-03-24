import { execFileSync } from 'node:child_process';

function run(command, args) {
  try {
    return {
      ok: true,
      stdout: execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim(),
    };
  } catch (error) {
    return {
      ok: false,
      stdout: error.stdout?.toString?.().trim?.() || '',
      stderr: error.stderr?.toString?.().trim?.() || error.message,
    };
  }
}

function line(label, value) {
  console.log(`${label}: ${value}`);
}

const profile = process.env.APPLE_KEYCHAIN_PROFILE || 'stakeos-notary';

console.log('StakeOS macOS release prerequisite check');
console.log('');

const notarytoolPath = run('xcrun', ['--find', 'notarytool']);
line('notarytool', notarytoolPath.ok ? notarytoolPath.stdout : 'missing');

const codesigning = run('security', ['find-identity', '-v', '-p', 'codesigning']);
const developerIds = (codesigning.stdout || '')
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line.includes('Developer ID Application'));
line('Developer ID identities', developerIds.length > 0 ? String(developerIds.length) : '0');
if (developerIds.length > 0) {
  developerIds.forEach((entry) => console.log(`  ${entry}`));
}

const keychainProfile = run('xcrun', ['notarytool', 'history', '--keychain-profile', profile]);
line('Keychain profile', keychainProfile.ok ? `${profile} (available)` : `${profile} (missing)`);

const hasApiKeyEnv = Boolean(process.env.APPLE_API_KEY && process.env.APPLE_API_KEY_ID && process.env.APPLE_API_ISSUER);
const hasAppleIdEnv = Boolean(process.env.APPLE_ID && process.env.APPLE_APP_SPECIFIC_PASSWORD && process.env.APPLE_TEAM_ID);
line('API key env', hasApiKeyEnv ? 'configured' : 'not configured');
line('Apple ID env', hasAppleIdEnv ? 'configured' : 'not configured');

console.log('');
if (!notarytoolPath.ok) {
  console.log('Missing Xcode notarytool. Install Xcode command line tools or Xcode.');
}
if (developerIds.length === 0) {
  console.log('Missing Developer ID Application certificate in Keychain.');
}
if (!keychainProfile.ok && !hasApiKeyEnv && !hasAppleIdEnv) {
  console.log(`No notarization credentials found. Create a notarytool keychain profile named "${profile}" or export Apple credential env vars.`);
}

const ready = notarytoolPath.ok && developerIds.length > 0 && (keychainProfile.ok || hasApiKeyEnv || hasAppleIdEnv);
console.log('');
line('Release ready', ready ? 'yes' : 'no');
process.exitCode = ready ? 0 : 1;
