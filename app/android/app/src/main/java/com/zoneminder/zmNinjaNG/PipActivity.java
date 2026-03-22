package com.zoneminder.zmNinjaNG;

import android.app.PictureInPictureParams;
import android.content.Intent;
import android.content.res.Configuration;
import android.os.Build;
import android.os.Bundle;
import android.util.Rational;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.media3.common.MediaItem;
import androidx.media3.common.Player;
import androidx.media3.exoplayer.ExoPlayer;
import androidx.media3.ui.PlayerView;

public class PipActivity extends AppCompatActivity {

    private ExoPlayer player;
    private PlayerView playerView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        playerView = new PlayerView(this);
        setContentView(playerView);

        String url = getIntent().getStringExtra("url");
        long position = getIntent().getLongExtra("position", 0);
        String aspectRatioStr = getIntent().getStringExtra("aspectRatio");

        if (url == null) {
            setResult(RESULT_CANCELED);
            finish();
            return;
        }

        player = new ExoPlayer.Builder(this).build();
        playerView.setPlayer(player);

        MediaItem mediaItem = MediaItem.fromUri(url);
        player.setMediaItem(mediaItem);
        player.prepare();
        player.seekTo(position);
        player.setPlayWhenReady(true);

        player.addListener(new Player.Listener() {
            @Override
            public void onPlaybackStateChanged(int playbackState) {
                if (playbackState == Player.STATE_ENDED) {
                    finishWithPosition();
                }
            }
        });

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Rational ratio = parseAspectRatio(aspectRatioStr);
            PictureInPictureParams.Builder pipBuilder = new PictureInPictureParams.Builder()
                    .setAspectRatio(ratio);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                pipBuilder.setAutoEnterEnabled(true);
            }

            setPictureInPictureParams(pipBuilder.build());
            enterPictureInPictureMode(pipBuilder.build());
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

    private void finishWithPosition() {
        long pos = player != null ? player.getCurrentPosition() : 0;
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
        if (player != null) {
            player.release();
            player = null;
        }
    }
}
