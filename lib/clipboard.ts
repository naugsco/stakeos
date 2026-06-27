/**
 * Shared clipboard helper. Throws when the clipboard API is unavailable
 * (e.g. a locked-down Electron context) so callers can surface the failure.
 */
export async function copyToClipboard(value: string): Promise<void> {
  if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
    throw new Error("Clipboard is unavailable.");
  }

  await navigator.clipboard.writeText(value);
}
