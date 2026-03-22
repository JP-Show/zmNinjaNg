import type { Options } from '@wdio/types';

export const config: Options.Testrunner = {
  runner: 'local',
  port: 4723,
  specs: ['./specs/**/*.spec.ts'],
  services: [
    ['appium', {
      args: { port: 4723 },
    }],
  ],
  framework: 'mocha',
  reporters: ['spec'],
  mochaOpts: {
    timeout: 120000,
  },
  capabilities: [{
    platformName: 'iOS',
    'appium:automationName': 'XCUITest',
    'appium:deviceName': 'iPhone 15',
    'appium:noReset': true,
  } as WebdriverIO.Capabilities],
};
