package com.zoneminder.zmNinjaNG;

import android.app.PendingIntent;
import android.app.PictureInPictureParams;
import android.app.RemoteAction;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.res.Configuration;
import android.graphics.drawable.Icon;
import android.os.Build;
import android.os.Bundle;
import android.util.Rational;

import android.app.Activity;
import android.util.Log;
import androidx.annotation.NonNull;
import androidx.media3.common.MediaItem;
import androidx.media3.common.MimeTypes;
import androidx.media3.common.Player;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.ui.PlayerView;

import java.util.ArrayList;
import java.util.List;

public class PipActivity extends Activity {

    private static final String TAG = "PipActivity";
    private static final String ACTION_PLAY_PAUSE = "com.zoneminder.zmNinjaNG.PIP_PLAY_PAUSE";

    private ExoPlayer player;
    private PlayerView playerView;
    private boolean pipEntered = false;
    private Rational aspectRatio;

    private final BroadcastReceiver pipReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (ACTION_PLAY_PAUSE.equals(intent.getAction()) && player != null) {
                if (player.isPlaying()) {
                    player.pause();
                } else {
                    player.play();
                }
                // Update PiP actions to reflect new play/pause state
                updatePipActions();
            }
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Remove window background so the PlayerView surface is visible in PiP
        getWindow().setBackgroundDrawable(null);
        getWindow().getDecorView().setBackgroundColor(0xFF000000);

        playerView = new PlayerView(this);
        playerView.setBackgroundColor(0xFF000000);
        // Use TextureView instead of SurfaceView for better PiP compatibility
        playerView.setUseController(false); // Hide controls in PiP
        setContentView(playerView);

        String url = getIntent().getStringExtra("url");
        long position = getIntent().getLongExtra("position", 0);
        String aspectRatioStr = getIntent().getStringExtra("aspectRatio");

        Log.d(TAG, "onCreate url=" + url + " position=" + position);

        if (url == null) {
            Log.e(TAG, "No URL provided");
            setResult(RESULT_CANCELED);
            finish();
            return;
        }

        aspectRatio = parseAspectRatio(aspectRatioStr);

        player = new ExoPlayer.Builder(this).build();
        playerView.setPlayer(player);

        // Build MediaItem with explicit MIME type so ExoPlayer doesn't
        // have to guess from ZoneMinder's PHP endpoint URL
        MediaItem mediaItem = new MediaItem.Builder()
                .setUri(url)
                .setMimeType(MimeTypes.VIDEO_MP4)
                .build();
        player.setMediaItem(mediaItem);
        player.prepare();
        player.seekTo(position);
        player.setPlayWhenReady(true);

        player.addListener(new Player.Listener() {
            @Override
            public void onPlaybackStateChanged(int playbackState) {
                Log.d(TAG, "playbackState=" + playbackState);
                if (playbackState == Player.STATE_ENDED) {
                    finishWithPosition();
                }
            }

            @Override
            public void onRenderedFirstFrame() {
                Log.d(TAG, "First frame rendered, entering PiP");
                enterPipMode();
            }

            @Override
            public void onPlayerError(@NonNull androidx.media3.common.PlaybackException error) {
                Log.e(TAG, "Player error: " + error.getMessage(), error);
                finishWithPosition();
            }
        });

        // Set PiP params (but do NOT auto-enter — we enter manually after first frame)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            PictureInPictureParams.Builder pipBuilder = new PictureInPictureParams.Builder()
                    .setAspectRatio(aspectRatio);
            setPictureInPictureParams(pipBuilder.build());
        }

        // Register broadcast receiver for PiP controls
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(pipReceiver, new IntentFilter(ACTION_PLAY_PAUSE), Context.RECEIVER_NOT_EXPORTED);
        } else {
            registerReceiver(pipReceiver, new IntentFilter(ACTION_PLAY_PAUSE));
        }
    }

    @Override
    public void onPictureInPictureModeChanged(boolean isInPictureInPictureMode,
                                               @NonNull Configuration newConfig) {
        super.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig);

        if (!isInPictureInPictureMode) {
            finishWithPosition();
        }
    }

    private void enterPipMode() {
        if (pipEntered) return;
        pipEntered = true;
        Log.d(TAG, "enterPipMode");
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            PictureInPictureParams.Builder pipBuilder = new PictureInPictureParams.Builder()
                    .setAspectRatio(aspectRatio)
                    .setActions(buildPipActions());
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                pipBuilder.setAutoEnterEnabled(true);
            }
            enterPictureInPictureMode(pipBuilder.build());
        }
    }

    private void updatePipActions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            PictureInPictureParams.Builder pipBuilder = new PictureInPictureParams.Builder()
                    .setActions(buildPipActions());
            setPictureInPictureParams(pipBuilder.build());
        }
    }

    private List<RemoteAction> buildPipActions() {
        List<RemoteAction> actions = new ArrayList<>();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            boolean isPlaying = player != null && player.isPlaying();
            int iconRes = isPlaying
                    ? android.R.drawable.ic_media_pause
                    : android.R.drawable.ic_media_play;
            String title = isPlaying ? "Pause" : "Play";

            PendingIntent pendingIntent = PendingIntent.getBroadcast(
                    this, 0, new Intent(ACTION_PLAY_PAUSE),
                    PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);

            RemoteAction action = new RemoteAction(
                    Icon.createWithResource(this, iconRes),
                    title, title, pendingIntent);
            actions.add(action);
        }
        return actions;
    }

    private void finishWithPosition() {
        long pos = player != null ? player.getCurrentPosition() : 0;
        Log.d(TAG, "finishWithPosition pos=" + pos);
        Intent resultIntent = new Intent();
        resultIntent.putExtra("position", pos);
        setResult(RESULT_OK, resultIntent);
        finish();
    }

    private Rational parseAspectRatio(String ratioStr) {
        if (ratioStr != null && ratioStr.contains(":")) {
            try {
                String[] parts = ratioStr.split(":");
                return new Rational(Integer.parseInt(parts[0]), Integer.parseInt(parts[1]));
            } catch (Exception ignored) {}
        }
        return new Rational(16, 9);
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        try {
            unregisterReceiver(pipReceiver);
        } catch (Exception ignored) {}
        if (player != null) {
            player.release();
            player = null;
        }
    }
}
