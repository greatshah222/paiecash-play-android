package com.wmspanel.reactstreamer;

import android.annotation.TargetApi;
import android.content.Context;
import android.content.SharedPreferences;
import android.hardware.camera2.CameraAccessException;
import android.hardware.camera2.CameraCharacteristics;
import android.hardware.camera2.CameraManager;
import android.hardware.camera2.CameraMetadata;
import android.media.MediaFormat;
import android.os.Build;
import android.util.Log;

import com.facebook.react.bridge.ReadableMap;
import com.wmspanel.libcommon.CameraInfo;
import com.wmspanel.libstream.CameraConfig;
import com.wmspanel.libstream.ConnectionConfig;
import com.wmspanel.libstream.RistConfig;
import com.wmspanel.libstream.SrtConfig;
import com.wmspanel.libstream.Streamer;
import com.wmspanel.libstream.StreamerGLBuilder;
import com.wmspanel.libstream.VideoConfig;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.annotation.Nullable;

public class SettingsUtils {
    private static final String TAG = "SettingsUtils";

    private static final Map<String, Streamer.Mode> CONFIG_STREAMER_MODES_MAP = createStremerModesMap();
    private static final Map<String, Streamer.Auth> CONFIG_AUTH_MODES_MAP = createStreamerAuthModesMap();
    private static final Map<String, Integer> CONFIG_SRT_MODE_MAP = createSrtModesMap();
    private static final Map<String, RistConfig.RistProfile> CONFIG_RIST_PROFILE_MAP = createRistProfilesMap();

    static private Map<String, Streamer.Mode> createStremerModesMap() {
        Map<String, Streamer.Mode> result = new HashMap<String, Streamer.Mode>();
        result.put("av", Streamer.Mode.AUDIO_VIDEO);
        result.put("a", Streamer.Mode.AUDIO_ONLY);
        result.put("audio", Streamer.Mode.AUDIO_ONLY);
        result.put("v", Streamer.Mode.VIDEO_ONLY);
        result.put("video", Streamer.Mode.VIDEO_ONLY);
        return result;
    }

    static private Map<String, Streamer.Auth> createStreamerAuthModesMap() {
        Map<String, Streamer.Auth> result = new HashMap<String, Streamer.Auth>();
        result.put("lime", Streamer.Auth.LLNW);
        result.put("limelignt", Streamer.Auth.LLNW);
        result.put("peri", Streamer.Auth.PERISCOPE);
        result.put("periscope", Streamer.Auth.PERISCOPE);
        result.put("rtmp", Streamer.Auth.RTMP);
        result.put("adobe", Streamer.Auth.RTMP);
        result.put("aka", Streamer.Auth.AKAMAI);
        result.put("akamai", Streamer.Auth.AKAMAI);
        return result;
    }

    static private Map<String, Integer> createSrtModesMap() {
        Map<String, Integer> result = new HashMap<>();
        result.put("c", 0);
        result.put("caller", 0);
        result.put("l", 1);
        result.put("listen", 1);
        result.put("r", 2);
        result.put("rendezvous", 2);
        return result;
    }

    static private Map<String, RistConfig.RistProfile> createRistProfilesMap() {
        Map<String, RistConfig.RistProfile> result = new HashMap<>();
        result.put("s", RistConfig.RistProfile.SIMPLE);
        result.put("m", RistConfig.RistProfile.MAIN);
        result.put("a", RistConfig.RistProfile.ADVANCED);
        result.put("simple", RistConfig.RistProfile.SIMPLE);
        result.put("main", RistConfig.RistProfile.MAIN);
        result.put("advanced", RistConfig.RistProfile.ADVANCED);
        return result;
    }

    // Important note: "device runs at least Android Lollipop" is not equal to "use Camera2 API".
    // Refer to SettingsUtils / allowCamera2Support and keep this logic in your app.
    public static boolean isUsingCamera2(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.LOLLIPOP) {
            return false;
        }
        return allowCamera2Support(context);
    }

    // Please note: you can't use only Camera, because even if Camera api still
    // works on new devices, it is better to use modern Camera2 api if possible.
    // For example, Nexus 5X must use Camera2:
    // http://www.theverge.com/2015/11/9/9696774/google-nexus-5x-upside-down-camera
    @TargetApi(Build.VERSION_CODES.LOLLIPOP)
    private static boolean allowCamera2Support(Context context) {

        String manufacturer = Build.MANUFACTURER;
        String model = Build.MODEL;

        Log.d(TAG, manufacturer + " " + model);

        // Some known camera api dependencies and issues:

        // Moto X Pure Edition, Android 6.0; Screen freeze reported with Camera2
        if (manufacturer.equalsIgnoreCase("motorola") && model.equalsIgnoreCase("clark_retus")) {
            return false;
        }

        /*
         LEGACY Camera2 implementation has problem with aspect ratio.
         Rather than allowing Camera2 API on all Android 5+ devices, we restrict it to
         cases where all cameras have at least LIMITED support.
         (E.g., Nexus 6 has FULL support on back camera, LIMITED support on front camera.)
         For now, devices with only LEGACY support should still use Camera API.
        */
        boolean result = true;
        android.hardware.camera2.CameraManager manager = (CameraManager) context.getSystemService(Context.CAMERA_SERVICE);
        try {
            for (String cameraId : manager.getCameraIdList()) {
                CameraCharacteristics characteristics = manager.getCameraCharacteristics(cameraId);
                int support = characteristics.get(CameraCharacteristics.INFO_SUPPORTED_HARDWARE_LEVEL);

                switch (support) {
                    case CameraMetadata.INFO_SUPPORTED_HARDWARE_LEVEL_LEGACY:
                        Log.d(TAG, "Camera " + cameraId + " has LEGACY Camera2 support");
                        break;
                    case CameraMetadata.INFO_SUPPORTED_HARDWARE_LEVEL_LIMITED:
                        Log.d(TAG, "Camera " + cameraId + " has LIMITED Camera2 support");
                        break;
                    case CameraMetadata.INFO_SUPPORTED_HARDWARE_LEVEL_FULL:
                        Log.d(TAG, "Camera " + cameraId + " has FULL Camera2 support");
                        break;
                    default:
                        Log.d(TAG, "Camera " + cameraId + " has LEVEL_3 or greater Camera2 support");
                        break;
                }

                if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N
                        && support == CameraMetadata.INFO_SUPPORTED_HARDWARE_LEVEL_LEGACY) {
                    // Can't use Camera2, bul let other cameras info to log
                    result = false;
                }
            }
        } catch (CameraAccessException | IllegalArgumentException e) {
            Log.e(TAG, Log.getStackTraceString(e));
            result = false;
        }
        return result;
    }

    // Find best matching FPS range
    // (fpsMax is much important to be closer to target, so we squared it)
    // In strict mode targetFps will be exact within range, otherwise just as close as possible
    public static Streamer.FpsRange nearestFpsRange(List<Streamer.FpsRange> fpsRanges, float targetFps, boolean strict) {
        //Find best matching FPS range
        // (fpsMax is much important to be closer to target, so we squared it)
        float minDistance = 1e10f;
        Streamer.FpsRange range = null;
        for (Streamer.FpsRange r : fpsRanges) {
            if (r.fpsMin > targetFps || r.fpsMax < targetFps) {
                continue;
            }
            float distance = ((r.fpsMax - targetFps) * (r.fpsMax - targetFps) + Math.abs(r.fpsMin - targetFps));
            if (distance < minDistance) {
                range = r;
                if (distance < 0.01f) {
                    break;
                }
                minDistance = distance;
            }
        }
        return range;
    }

    public static boolean addDefaultCameras(final StreamerGLBuilder builder,
                                            final List<CameraInfo> cameraList,
                                            final CameraInfo activeCameraInfo,
                                            final Streamer.Size videoSize,
                                            final float fps) {
        // start adding cameras from default camera, then add second camera
        // larix uses same resolution for camera preview and stream to simplify setup

        // add first camera to flip list, make sure you called setVideoConfig before
        final CameraConfig cameraConfig = new CameraConfig();
        cameraConfig.cameraId = activeCameraInfo.cameraId;
        cameraConfig.videoSize = videoSize;
        cameraConfig.fpsRange = nearestFpsRange(activeCameraInfo.fpsRanges, fps, false);

        builder.addCamera(cameraConfig);
        Log.d(TAG, "Camera #" + cameraConfig.cameraId + " resolution: " + cameraConfig.videoSize);

        // set start position in flip list to camera id
        builder.setCameraId(activeCameraInfo.cameraId);

        final boolean canFlip = cameraList.size() > 1;
        if (canFlip) {
            // loop through the available cameras
            for (CameraInfo cameraInfo : cameraList) {
                if (cameraInfo.cameraId.equals(activeCameraInfo.cameraId)) {
                    continue;
                }
                // add next camera to flip list
                final CameraConfig flipCameraConfig = new CameraConfig();
                flipCameraConfig.cameraId = cameraInfo.cameraId;
                flipCameraConfig.videoSize = findFlipSize(cameraInfo, videoSize);
                flipCameraConfig.fpsRange = nearestFpsRange(activeCameraInfo.fpsRanges, fps, false);

                builder.addCamera(flipCameraConfig);
                Log.d(TAG, "Camera #" + flipCameraConfig.cameraId + " resolution: " + flipCameraConfig.videoSize);
            }
        }
        return canFlip;
    }

    // Set the same video size for both cameras
    // If not possible (for example front camera has no FullHD support)
    // try to find video size with the same aspect ratio
    public static Streamer.Size findFlipSize(CameraInfo cameraInfo, Streamer.Size videoSize) {
        Streamer.Size flipSize = null;

        // If secondary camera supports same resolution, use it
        for (Streamer.Size size : cameraInfo.recordSizes) {
            if (size.equals(videoSize)) {
                flipSize = size;
                break;
            }
        }

        // If same resolution not found, search for same aspect ratio
        if (flipSize == null) {
            final double targetAspectRatio = (double) videoSize.width / videoSize.height;
            for (Streamer.Size size : cameraInfo.recordSizes) {
                if (size.width < videoSize.width) {
                    final double aspectRatio = (double) size.width / size.height;
                    final double aspectDiff = targetAspectRatio / aspectRatio - 1;
                    if (Math.abs(aspectDiff) < 0.01) {
                        flipSize = size;
                        break;
                    }
                }
            }
        }

        // Same aspect ratio not found, search for less or similar frame sides
        if (flipSize == null) {
            for (Streamer.Size size : cameraInfo.recordSizes) {
                if (size.height <= videoSize.height && size.width <= videoSize.width) {
                    flipSize = size;
                    break;
                }
            }
        }

        // Nothing found, use default
        if (flipSize == null) {
            flipSize = cameraInfo.recordSizes.get(0);
        }

        return flipSize;
    }

    public static Streamer.Size strToSize(String res, boolean vertical) {
        Integer w = 1280;
        Integer h = 720;
        String[] parts = res.split("[\\*\\:x]");
        if (parts.length == 2) {
            String wStr = parts[0];
            String hStr = parts[1];
            try {
                w = Integer.parseInt(wStr);
                h = Integer.parseInt(hStr);
            } catch (NumberFormatException e) {
                Log.e(TAG, "Invalid resolution");
            }
        }
        if (vertical) {
            return new Streamer.Size(h, w);
        }
        return new Streamer.Size(w, h);
    }

    public static Streamer.Mode getStreamerMode(@Nullable  ReadableMap settings) {
        Streamer.Mode mode = Streamer.Mode.AUDIO_VIDEO;
        if (settings == null || !settings.hasKey("mode")) {
            return mode;
        }
        final String modeStr = settings.getString("mode");
        if (CONFIG_STREAMER_MODES_MAP.containsKey(modeStr)) {
            mode = CONFIG_STREAMER_MODES_MAP.get(modeStr);
        }
        return mode;
    }

    public static void parseSrtParams(SrtConfig config, ReadableMap settings) {
        if (settings == null) {
            return;
        }
        if (settings.hasKey("connectMode")) {
            final String connMode = settings.getString("connectMode");
            int mode = SrtConfig.CALLER;
            if (CONFIG_SRT_MODE_MAP.containsKey(connMode)) {
                mode = CONFIG_SRT_MODE_MAP.get(connMode);
            }
            config.connectMode = mode;
        }
        int keylen = 0;
        if (settings.hasKey("pbkeylen")) {
            keylen = settings.getInt("pbkeylen");
        }
        if (settings.hasKey("passphrase") &&
                (keylen == 16 || keylen == 24 || keylen == 32)) {
            config.passphrase = settings.getString("passphrase");
            config.pbkeylen = keylen;
        }
        if (settings.hasKey("latency")) {
            config.latency = settings.getInt("latency");
        }
        if (settings.hasKey("maxbw")) {
            config.maxbw = settings.getInt("maxbw");
        }
        if (settings.hasKey("streamid")) {
            config.streamid = settings.getString("streamid");
        }
    }

    public static void parseRistParams(RistConfig config, ReadableMap settings) {
        if (settings == null) {
            return;
        }
        if (settings.hasKey("ristProfile")) {
            final String profileStr = settings.getString("ristProfile");
            RistConfig.RistProfile profile = RistConfig.RistProfile.MAIN;

            if (CONFIG_RIST_PROFILE_MAP.containsKey(profileStr)) {
                profile = CONFIG_RIST_PROFILE_MAP.get(profileStr);
            }
            config.profile = profile;
        }

    }

    public static void parseTcpParams(ConnectionConfig config, ReadableMap settings, String userInfo) {
        if (userInfo != null) {
            String[] userStrings = userInfo.split(":");
            if (userStrings.length >= 1) {
                config.username = userStrings[0];
                if (userStrings.length >= 2) {
                    config.password = userStrings[1];
                }
            }
        }
        if (settings == null) {
            return;
        }
        if (settings.hasKey("user")) {
            config.username = settings.getString("user");
            if (settings.hasKey("pass")) {
                config.password = settings.getString("pass");
            }
        }

        config.auth = getAuthMode(settings);
    }

    private static Streamer.Auth getAuthMode(@Nullable  ReadableMap settings) {
        Streamer.Auth auth = Streamer.Auth.DEFAULT;
        if (settings == null || !settings.hasKey("target")) {
            return auth;
        }
        final String authStr = settings.getString("target");
        if (CONFIG_AUTH_MODES_MAP.containsKey(authStr)) {
            auth = CONFIG_AUTH_MODES_MAP.get(authStr);
        }
        return auth;
    }

}
