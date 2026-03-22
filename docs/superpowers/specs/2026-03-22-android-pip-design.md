# Android Native PiP via ExoPlayer

**Issue:** #83

## Problem

Android WebView does not support the browser Picture-in-Picture API (`requestPictureInPicture()`). The PiP button in the video player does nothing on Android.

## Solution

A Capacitor plugin that launches a native Android `PipActivity` with ExoPlayer to play the video URL in PiP mode. The web layer detects Android and routes PiP requests to the native plugin instead of the browser API.

## Architecture

### Native Side

**PipPlugin.java** — Capacitor plugin registered in MainActivity:
- `enterPip(url, position, aspectRatio)` — saves the PluginCall, launches PipActivity via `startActivityForResult`
- `isPipSupported()` — returns `Build.VERSION.SDK_INT >= Build.VERSION_CODES.O`
- `@ActivityCallback handlePipResult(PluginCall call, ActivityResult result)` — extracts final playback position from result Intent, resolves the saved call

**PipActivity.java** — Lightweight Activity with ExoPlayer:
- Receives video URL (already contains `?token=` auth param), start position, and aspect ratio via Intent extras
- Creates ExoPlayer with a `DefaultHttpDataSource.Factory` (no custom headers needed — ZM auth is via `?token=` query param already in the URL)
- Seeks to the provided start position
- Calls `enterPictureInPictureMode()` after player is ready
- `onPictureInPictureModeChanged(false)` — calls `setResult(RESULT_OK, intent)` with final playback position, then `finish()`
- `onDestroy` — releases ExoPlayer

**AndroidManifest.xml** — Add PipActivity:
```xml
<activity
    android:name=".PipActivity"
    android:supportsPictureInPicture="true"
    android:configChanges="screenSize|smallestScreenSize|screenLayout|orientation"
    android:launchMode="singleTask"
    android:resizeableActivity="true"
    android:exported="false"
    android:theme="@style/AppTheme.NoActionBar" />
```

**build.gradle** — Add Media3 dependencies:
```gradle
implementation "androidx.media3:media3-exoplayer:1.5.1"
implementation "androidx.media3:media3-ui:1.5.1"
implementation "androidx.media3:media3-datasource:1.5.1"
```

### Web Side

**Plugin wrapper** (`app/src/plugins/pip/index.ts`, `definitions.ts`, `web.ts`) — follows the same pattern as the existing SSLTrust plugin:
- `definitions.ts` — TypeScript interface for `PipPlugin` with `enterPip()` and `isPipSupported()` methods
- `index.ts` — `registerPlugin<PipPlugin>('Pip', { web: () => ... })`
- `web.ts` — Web fallback (no-op or uses browser PiP API)

**PipContext.tsx modifications:**
- Add a separate `enterAndroidPip(url: string, position: number, eventId: string)` method (not modifying `adoptForPip` — the DOM-based browser PiP semantics don't apply to native)
- This method: pauses the web player, sets `activePipEventId`, calls the native plugin
- On native callback: stores the returned playback position, clears `activePipEventId`

**video-player.tsx modifications:**
- On Android (`Capacitor.getPlatform() === 'android'`): intercept the PiP button click
- Instead of browser PiP, call `enterAndroidPip(src, player.currentTime(), eventId)`
- On remount: if `activePipEventId` matches, seek to the stored position from native PiP

## Authentication

ZoneMinder uses `?token=` query parameters for authentication, not `Authorization` headers. The video URL passed to ExoPlayer already contains the token (built by `getEventVideoUrl()` in the web layer). No custom headers on `DefaultHttpDataSource.Factory` are needed.

## Lifecycle

1. User taps PiP on event video (Android, API 26+)
2. Web layer pauses video.js player, captures `currentTime()`
3. Calls native `enterPip({ url: videoUrlWithToken, position, aspectRatio })`
4. Plugin saves the PluginCall, launches PipActivity via `startActivityForResult`
5. PipActivity creates ExoPlayer, seeks to position, enters PiP mode
6. User can navigate the app — WebView is unaffected
7. User taps PiP window or video ends → PipActivity exits PiP
8. `onPictureInPictureModeChanged(false)` fires → `setResult(RESULT_OK, intent)` with final position → `finish()`
9. Plugin's `@ActivityCallback handlePipResult` resolves the call with position
10. PipContext receives position, stores it, clears `activePipEventId`
11. If user is on the same EventDetail, web player seeks to returned position

## API Level Handling

- `minSdkVersion` remains 23 (no change)
- PiP requires API 26+
- `isPipSupported()` checks `Build.VERSION.SDK_INT >= Build.VERSION_CODES.O`
- On API < 26, the web layer hides PiP controls on Android
- Auto-enter PiP (`setAutoEnterEnabled`) used on API 31+ when available

## Constraints

- Only one native PiP at a time (Android enforces)
- ExoPlayer runs in a separate Activity — no shared state beyond Intent extras
- Position sync is best-effort (small gap between web pause and native resume)
- Native PiP shows Android's default media controls (play/pause) — no custom markers
- APK size increases ~2-3 MB from Media3 dependency
