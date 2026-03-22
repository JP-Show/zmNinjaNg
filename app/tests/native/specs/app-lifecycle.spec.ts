import { expect } from '@wdio/globals';

describe('App Lifecycle', () => {
  it('should preserve state after backgrounding and foregrounding', async () => {
    await browser.switchContext('WEBVIEW_com.zoneminder.zmNinjaNG');
    await browser.url('/dashboard');
    await browser.pause(2000);

    await browser.switchContext('NATIVE_APP');
    await driver.background(10);

    await browser.switchContext('WEBVIEW_com.zoneminder.zmNinjaNG');
    const url = await browser.getUrl();
    expect(url).toContain('/dashboard');
  });
});
