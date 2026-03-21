/**
 * Biometric Auth Hook
 *
 * Wraps @aparajita/capacitor-biometric-auth with dynamic import and
 * platform detection. Attempts biometric auth on all platforms
 * (Touch ID, Face ID, Windows Hello, WebAuthn), falls back gracefully
 * when unavailable.
 */

import { log, LogLevel } from '../lib/logger';

interface BiometricResult {
  success: boolean;
  error?: string;
}

export async function checkBiometricAvailability(): Promise<boolean> {
  try {
    const { BiometricAuth } = await import('@aparajita/capacitor-biometric-auth');
    const result = await BiometricAuth.checkBiometry();
    log.auth('Biometric check result', LogLevel.DEBUG, {
      isAvailable: result.isAvailable,
      biometryType: result.biometryType,
    });
    return result.isAvailable;
  } catch {
    log.auth('Biometric auth not available on this platform', LogLevel.DEBUG);
    return false;
  }
}

export async function authenticateWithBiometrics(reason: string): Promise<BiometricResult> {
  try {
    const { BiometricAuth } = await import('@aparajita/capacitor-biometric-auth');
    await BiometricAuth.authenticate({
      reason,
      cancelTitle: 'Use PIN',
      allowDeviceCredential: false,
    });
    log.auth('Biometric authentication succeeded', LogLevel.INFO);
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Biometric auth failed';
    log.auth('Biometric authentication failed', LogLevel.DEBUG, { error: message });
    return { success: false, error: message };
  }
}
