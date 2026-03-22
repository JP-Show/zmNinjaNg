// Appium setup helpers for native test suite
export async function waitForAppReady(): Promise<void> {
  // TODO: implement app readiness check
  await browser.pause(3000);
}
