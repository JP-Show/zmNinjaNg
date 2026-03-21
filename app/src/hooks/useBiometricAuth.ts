/**
 * Biometric Auth Hook
 *
 * Platform-aware biometric authentication:
 * - Capacitor (iOS/Android): uses @aparajita/capacitor-biometric-auth
 * - Desktop/Web (macOS Touch ID, Windows Hello): uses WebAuthn PublicKeyCredential API
 *
 * The WebAuthn approach creates a temporary credential challenge that triggers
 * the platform biometric prompt (Touch ID dialog on macOS, Windows Hello on Windows).
 * No credential is actually stored — we only use it to verify the user is present.
 */

import { log, LogLevel } from '../lib/logger';

interface BiometricResult {
  success: boolean;
  error?: string;
}

/**
 * Check if biometric authentication is available via WebAuthn.
 * This works on macOS (Touch ID) and Windows (Windows Hello) in browser/Tauri.
 */
async function checkWebAuthnAvailability(): Promise<boolean> {
  try {
    if (
      typeof window !== 'undefined' &&
      window.PublicKeyCredential &&
      typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
    ) {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    }
  } catch {
    // Not available
  }
  return false;
}

/**
 * Authenticate using WebAuthn (Touch ID / Windows Hello).
 * Creates a throwaway credential to trigger the biometric prompt.
 */
async function authenticateWithWebAuthn(): Promise<BiometricResult> {
  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const userId = crypto.getRandomValues(new Uint8Array(16));

    // First create a credential so we can verify against it
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: 'zmNinjaNG Kiosk' },
        user: {
          id: userId,
          name: 'kiosk-user',
          displayName: 'Kiosk User',
        },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
        },
        timeout: 60000,
      },
    });

    if (credential) {
      log.auth('WebAuthn biometric authentication succeeded', LogLevel.INFO);
      return { success: true };
    }
    return { success: false, error: 'No credential created' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'WebAuthn auth failed';
    log.auth('WebAuthn biometric authentication failed', LogLevel.DEBUG, { error: message });
    return { success: false, error: message };
  }
}

/**
 * Check if biometric authentication is available on the current device.
 * Tries Capacitor first (mobile), then WebAuthn (desktop/web).
 */
export async function checkBiometricAvailability(): Promise<boolean> {
  // Try Capacitor biometric plugin (iOS/Android)
  try {
    const { BiometricAuth } = await import('@aparajita/capacitor-biometric-auth');
    const result = await BiometricAuth.checkBiometry();
    log.auth('Capacitor biometric check', LogLevel.DEBUG, {
      isAvailable: result.isAvailable,
      biometryType: result.biometryType,
    });
    if (result.isAvailable) return true;
  } catch {
    // Not on Capacitor or plugin unavailable
  }

  // Try WebAuthn (macOS Touch ID, Windows Hello)
  const webAuthnAvailable = await checkWebAuthnAvailability();
  if (webAuthnAvailable) {
    log.auth('WebAuthn platform authenticator available', LogLevel.DEBUG);
    return true;
  }

  log.auth('No biometric auth available on this platform', LogLevel.DEBUG);
  return false;
}

/**
 * Attempt biometric authentication.
 * Returns { success: true } if authenticated, { success: false, error } otherwise.
 */
export async function authenticateWithBiometrics(reason: string): Promise<BiometricResult> {
  // Try Capacitor biometric plugin (iOS/Android)
  try {
    const { BiometricAuth } = await import('@aparajita/capacitor-biometric-auth');
    const checkResult = await BiometricAuth.checkBiometry();
    if (checkResult.isAvailable) {
      await BiometricAuth.authenticate({
        reason,
        cancelTitle: 'Use PIN',
        allowDeviceCredential: false,
      });
      log.auth('Capacitor biometric authentication succeeded', LogLevel.INFO);
      return { success: true };
    }
  } catch (error) {
    // If Capacitor plugin exists and auth was attempted but failed, return failure
    const message = error instanceof Error ? error.message : 'Biometric auth failed';
    try {
      const { Capacitor } = await import('@capacitor/core');
      if (Capacitor.isNativePlatform()) {
        log.auth('Capacitor biometric authentication failed', LogLevel.DEBUG, { error: message });
        return { success: false, error: message };
      }
    } catch {
      // Not on Capacitor
    }
  }

  // Try WebAuthn (macOS Touch ID, Windows Hello)
  const webAuthnAvailable = await checkWebAuthnAvailability();
  if (webAuthnAvailable) {
    return authenticateWithWebAuthn();
  }

  return { success: false, error: 'No biometric auth available' };
}
