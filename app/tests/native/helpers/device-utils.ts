// Device utility helpers for native tests
export async function getDeviceInfo(): Promise<{ platform: string; deviceName: string }> {
  const caps = await browser.getSession();
  return {
    platform: (caps as Record<string, string>).platformName ?? 'unknown',
    deviceName: (caps as Record<string, string>).deviceName ?? 'unknown',
  };
}
