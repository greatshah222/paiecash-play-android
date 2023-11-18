package com.wmspanel.reactstreamer;

import android.app.Activity;
import android.content.Context;
import android.content.pm.ActivityInfo;
import android.content.res.Configuration;
import android.graphics.Bitmap;
import android.media.MediaFormat;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.Gravity;
import android.view.SurfaceHolder;
import android.view.SurfaceView;
import android.widget.FrameLayout;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.wmspanel.libcommon.CameraRegistry;
import com.wmspanel.libstream.AudioConfig;
import com.wmspanel.libstream.VideoConfig;
import com.wmspanel.libstream.ConnectionConfig;
import com.wmspanel.libstream.RistConfig;
import com.wmspanel.libstream.SrtConfig;
import com.wmspanel.libstream.Streamer;
import com.wmspanel.libstream.StreamerGL;
import com.wmspanel.libstream.StreamerGLBuilder;
import com.wmspanel.libcommon.AspectFrameLayout;
import com.wmspanel.libcommon.UriResult;
import com.wmspanel.libcommon.CameraInfo;
import com.wmspanel.libcommon.MediaCodecUtils;
import com.wmspanel.libcommon.ConnectionStatistics;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.io.IOException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Timer;
import java.util.TimerTask;

public class StreamerView extends AspectFrameLayout implements Streamer.Listener {

    private static final String TAG = "StreamerView";

    public boolean mAutostart;
    public boolean mUseCamera2;
    public boolean mVerticalVideo;
    public boolean mLiveRotation = false;
    private boolean mLockOrientation = false;

    protected SurfaceView mSurfaceView;
    private Handler mHandler;
    protected SurfaceHolder mHolder;
    protected StreamerGL mStreamerGL;
    private boolean mStreamerActive = false;
    private boolean mConnectionActive = false;
    private boolean mWriting = false;

    private Timer mUpdateStatisticsTimer;
    private int mUpdateStatsInteval;

    VideoConfig mVideoConfig;
    AudioConfig mAudioConfig;
    Streamer.Size mEncoderVideoSize = new Streamer.Size(1280, 720);
    Streamer.Size mVideoSize = new Streamer.Size(1280, 720);

    private String mCameraId = "0";
    private Streamer.CaptureState mVideoCaptureState = Streamer.CaptureState.STOPPED;
    private Streamer.CaptureState mAudioCaptureState = Streamer.CaptureState.STOPPED;

    private List<CameraInfo> mCameraList;
    private List<Integer> connections = new ArrayList<>();
    private final Map<Integer, Streamer.ConnectionState> mConnectionState = new HashMap<>();
    private final Map<Integer, ConnectionStatistics> mConnectionStatistics = new HashMap<>();


    protected SurfaceHolder.Callback mPreviewHolderCallback = new SurfaceHolder.Callback() {
        @Override
        public void surfaceCreated(@NonNull SurfaceHolder holder) {
            Log.v(TAG, "surfaceCreated()");

            if (mHolder != null) {
                Log.e(TAG, "SurfaceHolder already exists"); // should never happens
                return;
            }

            mHolder = holder;
            // We got surface to draw on, start streamer creation
            if (mAutostart) {
                createStreamer();
                mAutostart = false;
            }
        }

        @Override
        public void surfaceChanged(@NonNull SurfaceHolder holder, int format, int width, int height) {
            //Log.v(TAG, "surfaceChanged() " + width + "x" + height);
            if (mStreamerGL != null) {
                mStreamerGL.setSurfaceSize(new Streamer.Size(width, height));
            }
        }

        @Override
        public void surfaceDestroyed(@NonNull SurfaceHolder holder) {
            Log.v(TAG, "surfaceDestroyed()");
            mHolder = null;
            releaseStreamer();
        }
    };

    @Override
    protected void finalize() throws Throwable {
        super.finalize();
        Log.d(TAG, "StreamerView finalize");
    }

    protected final Runnable mUpdateStatistics = new Runnable() {
        @Override
        public void run() {
            if (mStreamerGL == null) {
                return;
            }

            for (int id : connections) {
                Streamer.ConnectionState state = mConnectionState.get(id);
                if (state == null) {
                    continue;
                }

                // some auth schemes require reconnection to same url multiple times
                // app should not query connection statistics while auth phase is in progress
                if (state == Streamer.ConnectionState.RECORD) {
                    ConnectionStatistics statistics = mConnectionStatistics.get(id);
                    if (statistics != null) {
                        statistics.update(mStreamerGL, id);
                    }
                }
            }

            updateConnectionInfo();

        }
    };


    public void onResume() {
        if (mHolder != null) {
            Log.v(TAG, "Resuming after pause");
            createStreamer();
        }
        if (mUpdateStatsInteval > 0) {
            mUpdateStatisticsTimer = new Timer();
            mUpdateStatisticsTimer.schedule(new TimerTask() {
                @Override
                public void run() {
                    mHandler.post(mUpdateStatistics);
                }
            }, mUpdateStatsInteval, mUpdateStatsInteval);
        }
    }

    public void onPause() {
        if (mUpdateStatisticsTimer != null) {
            updatePreviewRatio(mVideoSize);
            mUpdateStatisticsTimer.cancel();
            mUpdateStatisticsTimer = null;
        }
        if (mHolder != null) {
            mAutostart = true;
        }

        releaseStreamer();

    }

    public StreamerView(Context context) {
        super(context);
        mSurfaceView = new SurfaceView(context);
        mSurfaceView.getHolder().addCallback(mPreviewHolderCallback);
        FrameLayout.LayoutParams layoutParams = new FrameLayout.LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT, Gravity.CENTER);
        addView(mSurfaceView, layoutParams);
        mHandler = new Handler(Looper.getMainLooper());

        // default config: h264, 2 mbps, 2 sec. keyframe interval
        mVideoConfig = new VideoConfig();
        mVideoConfig.videoSize = mVideoSize;
        mAudioConfig = new AudioConfig();
        mUseCamera2 = SettingsUtils.isUsingCamera2(context);
    }

    public void createStreamer() {
        mStreamerActive = true;
        mHandler.post(() -> {
            createStreamerInternal();
        });

    }

    private void createStreamerInternal() {
        Log.v(TAG, "createStreamer()");
        if (mStreamerGL != null && mHolder == null) {
            Log.e(TAG, "No surface holder");
            return;
        }

        final StreamerGLBuilder builder = new StreamerGLBuilder();
        configureBuilder(builder);
        mStreamerGL = builder.build();

        if (mStreamerGL != null) {
            mStreamerGL.startVideoCapture();
            mStreamerGL.startAudioCapture();
        }

        updatePreviewRatio(mVideoSize);
    }

    public void setTorch(boolean isOn) {
        if (mStreamerGL == null)
            return;
        boolean currentValue = mStreamerGL.isTorchOn();
        if (currentValue != isOn) {
            mStreamerGL.toggleTorch();
        }
    }

    public void setSilence(boolean isMute) {
        if (mStreamerGL == null)
            return;
        mStreamerGL.setSilence(isMute);
    }

    public void setZoom(float zoom) {
        if (mStreamerGL == null)
            return;
        mStreamerGL.zoomTo(zoom);
    }

    public void setUpdateInterval(float interval) {
        if (mUpdateStatisticsTimer != null) {
            mUpdateStatisticsTimer.cancel();
            mUpdateStatisticsTimer = null;
        }
        mUpdateStatsInteval = (int)(interval * 1000);
        if (interval > 0) {
            mUpdateStatisticsTimer = new Timer();
            mUpdateStatisticsTimer.schedule(new TimerTask() {
                @Override
                public void run() {
                    mHandler.post(mUpdateStatistics);
                }
            }, mUpdateStatsInteval, mUpdateStatsInteval);
        }
    }

    public void setCamera(String camId, String position) {
        final List<CameraInfo> cameraList = getCameraList();
        String newCamera = mCameraId;
        for (CameraInfo info : cameraList) {
            if (camId.isEmpty()) {
                if ((info.lensFacing == CameraInfo.LENS_FACING_BACK && position.equals("back")) ||
                        (info.lensFacing == CameraInfo.LENS_FACING_FRONT && position.equals("front"))) {
                    newCamera = info.cameraId;
                    break;
                }
            }
            if (info.cameraId.equals(camId)) {
                newCamera = info.cameraId;
                break;
            }
        }
        String currentCamId = null;
        if (mStreamerGL != null) {
            currentCamId = mStreamerGL.getActiveCameraId();
        }
        if (currentCamId == null) {
            mCameraId = newCamera;
            return;
        }
        if (currentCamId.equals(newCamera)) {
            return;
        }
        final String nextCamera = newCamera;
        mHandler.post(() -> {
            Log.d(TAG, "Flip to camera " + nextCamera);
            mStreamerGL.flip(nextCamera, null);
            mCameraId = mStreamerGL.getActiveCameraId();
            Log.d(TAG, "Active camera " + mCameraId);

            List<CameraInfo> infoList = getCameraList();
            ReadableMap result = new WritableNativeMap();
            CameraInfo activeInfo = null;
            for (CameraInfo cameraInfo : infoList) {
                if (cameraInfo.cameraId.equals(mCameraId)) {
                    activeInfo = cameraInfo;
                    break;
                }
            }
            if (activeInfo != null) {
                ReactContext context = (ReactContext) getContext();
                context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit(
                        "onCameraChanged", CameraInfoReact.toReactMap(activeInfo));
            }
        });


    }

    public void setVideoConfig(ReadableMap config) {
        if (config.hasKey("res")) {
            String res = config.getString("res");
            if (res != null && !res.isEmpty()) {
                mVideoSize = SettingsUtils.strToSize(res, false);
                mEncoderVideoSize =  SettingsUtils.strToSize(res, mVerticalVideo);
                mVideoConfig.videoSize = mEncoderVideoSize;
            }
        }
        if (config.hasKey("fps")) {
            String fpsStr = config.getString("fps");
            int sepPos = fpsStr.indexOf('-');
            //TODO: set range instead of max value
            if (sepPos > 0) {
                fpsStr = fpsStr.substring(sepPos+1);
            }
            float fps = 0;
            try {
                fps = Float.parseFloat(fpsStr);
            } catch (NumberFormatException e) {
                Log.e(TAG, "Invalid fps value");
            }
            if (fps > 0) {
                mVideoConfig.fps = fps;
            }
        }
        if (config.hasKey("format")) {
            String videoCodec = config.getString("format");
            if (videoCodec.equals("avc") || videoCodec.equals("h264")) {
                mVideoConfig.type = MediaFormat.MIMETYPE_VIDEO_AVC;
            } else if (videoCodec.equals("hevc") || videoCodec.equals("h265")) {
                mVideoConfig.type = MediaFormat.MIMETYPE_VIDEO_HEVC;
            }
        }
        int bitrate = 0;
        if (config.hasKey("bitrate")) {
            bitrate = config.getInt("bitrate");
        }
        if (bitrate == 0) {
            bitrate = MediaCodecUtils.recommendedBitrateKbps(mVideoConfig.type, mVideoConfig.videoSize.height, mVideoConfig.fps);
        }
        mVideoConfig.bitRate = bitrate * 1000;
        if (config.hasKey("keyframe")) {
            int interval = config.getInt("keyframe");
            if (interval > 0) {
                mVideoConfig.keyFrameInterval = interval;
            }
        }
        if (config.hasKey("liveRotation")) {
            String rotation = config.getString("liveRotation");
            if (rotation.equals("off")) {
                mLiveRotation = false;
                mLockOrientation = false;
            } else if (rotation.equals("on") || rotation.equals("follow")) {
                mLiveRotation = true;
                mLockOrientation = false;
            } else if (rotation.equals("lock")) {
                mLiveRotation = true;
                mLockOrientation = true;
            }
        }
    }

    public void setAudioConfig(ReadableMap config) {
        if (config.hasKey("bitrate")) {
            int bitrate = config.getInt("bitrate");
            if (bitrate > 0) {
                mAudioConfig.bitRate = bitrate * 1000;
            }
        }
        if (config.hasKey("channels")) {
            int channels = config.getInt("channels");
            if (channels > 0) {
                mAudioConfig.channelCount = channels;
            }
        }
        if (config.hasKey("samples")) {
            int samples = config.getInt("samples");
            if (samples > 0) {
                mAudioConfig.sampleRate = samples;
            }
        }
    }

    public void setResizeMode(String mode) {
        if (mode.equals("fit")) {
            mResizeMode = ResizeMode.FIT_ASPECT;
        } else if (mode.equals("fill")) {
            mResizeMode = ResizeMode.FILL_ASPECT;
        } else if (mode.equals("stretch")) {
            mResizeMode = ResizeMode.FILL;
        }
        setResizeMode(mResizeMode);
    }

    public void setLockedOrientation(boolean locked, Activity activity) {
        if (mStreamerGL != null) {
            mStreamerGL.setDisplayRotation(displayRotation());
            mStreamerGL.setVideoOrientation(videoOrientation());
        }
        if (mLiveRotation && mLockOrientation) {
            int orientation = locked ? ActivityInfo.SCREEN_ORIENTATION_LOCKED : ActivityInfo.SCREEN_ORIENTATION_SENSOR;
            activity.setRequestedOrientation(orientation);
        }
    }

    public int connectTo(String urlStr, @Nullable ReadableMap settings) {
        int connectionId = -1;
        if (mStreamerGL == null) {
            Log.e(TAG, "No streamer");
            return connectionId;
        }
        if (urlStr == null && settings.hasKey("url")) {
            urlStr = settings.getString("url");
        }
        if (urlStr == null) {
            Log.e(TAG, "No URL");
            return connectionId;
        }
        UriResult parsedUrl = UriResult.parseUri(urlStr, false);
        if (parsedUrl.error != null) {
            return connectionId;
        }
        Streamer.Mode streamMode = SettingsUtils.getStreamerMode(settings);
        if (parsedUrl.isSrt()) {
            final SrtConfig config = new SrtConfig();
            config.host = parsedUrl.host;
            config.port = parsedUrl.port;
            config.mode = streamMode;
            SettingsUtils.parseSrtParams(config, settings);
            connectionId = mStreamerGL.createConnection(config);

        } else if (parsedUrl.isRist()) {
            final RistConfig config = new RistConfig();
            config.uri = parsedUrl.uri;
            config.mode = streamMode;
            SettingsUtils.parseRistParams(config, settings);
            connectionId = mStreamerGL.createConnection(config);

        } else {
            ConnectionConfig config = new ConnectionConfig();
            config.uri = parsedUrl.uri;
            config.mode = streamMode;
            SettingsUtils.parseTcpParams(config, settings, null); //parsedUrl.userInfo
            connectionId = mStreamerGL.createConnection(config);
        }

        if (connectionId >= 0) {
            mConnectionActive = true;
            connections.add(connectionId);
            mConnectionStatistics.put(connectionId, new ConnectionStatistics());

        }
        return connectionId;
    }

    public void disconnectAll() {
        mConnectionActive = false;
        List<Integer> connList = new ArrayList<>(connections);
        for (Integer id : connList) {
            releaseConnection(id);
        }
    }

    public void takeSnapshot(File path, String filename) {
        if (filename == null || filename.isEmpty()) {
            Date now = new Date();
            String baseName = new SimpleDateFormat("yyyyMMdd-HHmmss", Locale.US).format(now);
            filename = "IMG_" + baseName + ".jpg";
        }
        File file = new File(path, filename);
        try {
            mStreamerGL.takeSnapshot(file, Bitmap.CompressFormat.JPEG, 90, false);
        } catch (SecurityException | IOException e) {
            Log.e(TAG, Log.getStackTraceString(e));
        }
    }

    public void startRecord(File path, String filename) {
        if (mStreamerGL == null) {
            return;
        }
        if (filename == null || filename.isEmpty()) {
            Date now = new Date();
            String baseName = new SimpleDateFormat("yyyyMMdd-HHmmss", Locale.US).format(now);
            filename = baseName + ".mp4";
        }
        File file = new File(path, filename);
        if (!mWriting) {
            mStreamerGL.startRecord(file);
            mWriting = true;
        } else {
            mStreamerGL.splitRecord(file);
        }
    }

    public void stopRecord() {
        if (mStreamerGL == null) {
            return;
        }

        mStreamerGL.stopRecord();
        mWriting = false;
    }

    private void updateConnectionInfo() {
        WritableNativeMap stats = new WritableNativeMap();
        boolean isEmpty = true;
        for(Integer connId: mConnectionStatistics.keySet()) {
            WritableNativeMap connStats = new WritableNativeMap();
            ConnectionStatistics sts = mConnectionStatistics.get(connId);
            Streamer.ConnectionState state = mConnectionState.get(connId);
            if (state != Streamer.ConnectionState.RECORD) {
                continue;
            }

            String key = Integer.toString(connId);
            connStats.putInt("duration", (int)sts.getDuration());
            connStats.putDouble("bytesDelivered", (double)sts.getTraffic());
            connStats.putDouble("bitrate", (double) sts.getBandwidth());
            connStats.putBoolean("lostIncreased", sts.isDataLossIncreasing());
            stats.putMap(key, connStats);
            isEmpty = false;
        }
        if (!isEmpty || mWriting) {
            ReactContext context = (ReactContext) getContext();
            context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit(
                    "onStreamerStats", stats);
        }


    }

    public void updateOrientation(int orientation) {
        final boolean portrait = orientation == Configuration.ORIENTATION_PORTRAIT;
        final String orientationStr = portrait ? "portrait" : "landscape";
        Log.i(TAG, "Rotated to " + orientationStr);

        if (mStreamerGL == null) {
            return;
        }

        if (shouldUpdateVideoOrientation()) {
            mStreamerGL.setVideoOrientation(videoOrientation());
        }

        // Set display rotation to flip image correctly, should be called always
        mStreamerGL.setDisplayRotation(displayRotation());

        updatePreviewRatio(mVideoSize);
    }

    protected void configureBuilder(StreamerGLBuilder builder) {
        builder.setContext(getContext());
        builder.setListener(this);

        builder.setAudioConfig(mAudioConfig);

        builder.setVideoConfig(mVideoConfig);

        builder.setCamera2(mUseCamera2);

        // preview surface
        builder.setSurface(mHolder.getSurface());
        builder.setSurfaceSize(new Streamer.Size(mSurfaceView.getWidth(), mSurfaceView.getHeight()));

        // streamer will start capture from this camera id
        builder.setCameraId(mCameraId);

        final List<CameraInfo> cameraList = getCameraList();
        CameraInfo activeInfo = cameraList.get(0);
        for(CameraInfo i: cameraList) {
            if (i.cameraId == mCameraId) {
                activeInfo = i;
                break;
            }
        }
        SettingsUtils.addDefaultCameras(builder, cameraList, activeInfo, mVideoSize, mVideoConfig.fps);
        builder.setVideoOrientation(videoOrientation());
        builder.setDisplayRotation(displayRotation());
    }

    public boolean isStreamerActive() {
        return mStreamerActive;
    }

    public void releaseStreamer() {
        mStreamerActive = false;

        if (mStreamerGL != null) {
            mHandler.post(() -> {
                releaseStreamerInternal();
            });
        }

    }

    private void releaseStreamerInternal() {
        if (mStreamerGL == null) {
            return;
        }
        // stop broadcast
        disconnectAll();
        // stop mp4 recording
        mStreamerGL.stopRecord();
        // cancel audio and video capture
        mStreamerGL.stopAudioCapture();
        mStreamerGL.stopVideoCapture();
        mStreamerGL.release();
        mStreamerGL = null;
    }


    private boolean isPortrait() {
        return getResources().getConfiguration().orientation == Configuration.ORIENTATION_PORTRAIT;
    }

    private int videoOrientation() {
        return isPortrait() ? StreamerGL.Orientations.PORTRAIT : StreamerGL.Orientations.LANDSCAPE;
    }

    protected boolean shouldUpdateVideoOrientation() {
        return mLiveRotation && !mLockOrientation;
    }

    public boolean isOrientationLocked() {
        return mLiveRotation && mLockOrientation;
    }

    public int initialOrientation() {
        if (!isStreamerActive()) {
            return ActivityInfo.SCREEN_ORIENTATION_SENSOR;
        }
        if (mLiveRotation) {
            if (isOrientationLocked() && mConnectionActive) {
                return ActivityInfo.SCREEN_ORIENTATION_LOCKED;
            } else {
                return ActivityInfo.SCREEN_ORIENTATION_SENSOR;
            }
        } else {
            return mVerticalVideo ?
                    ActivityInfo.SCREEN_ORIENTATION_PORTRAIT : ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE;
        }
    }


    private int displayRotation() {
        ReactContext rctContext = (ReactContext) getContext();
        return rctContext.getCurrentActivity().getWindowManager().getDefaultDisplay().getRotation();
    }

    private void updatePreviewRatio(Streamer.Size size) {
        setAspectRatio(isPortrait() ? size.getVerticalRatio() : size.getRatio());
    }

    @Override
    public void onConnectionStateChanged(int connectionId, Streamer.ConnectionState state, Streamer.Status status, JSONObject info) {
        Log.d(TAG, "onConnectionStateChanged, connectionId=" + connectionId + ", state=" + state + ", status=" + status);
        if (!connections.contains(connectionId)) {
            return;
        }
        if (state == Streamer.ConnectionState.CONNECTED) {
            ConnectionStatistics statistics = mConnectionStatistics.get(connectionId);
            if (statistics != null) {
                statistics.init();
            }
        }
        notifiyConnectionStateChange(connectionId, state, status, info);
        if (state == Streamer.ConnectionState.DISCONNECTED) {
            releaseConnection(connectionId);
        } else {
            mConnectionState.put(connectionId, state);
        }
    }

    public void releaseConnection(int connectionId) {
        if (mStreamerGL == null || connectionId == -1) {
            return;
        }
        Integer connID = connectionId;
        connections.remove(connID);
        mConnectionState.remove(connID);
        mConnectionStatistics.remove(connID);
        mStreamerGL.releaseConnection(connectionId);

    }

    @Override
    public Handler getHandler() {
        return mHandler;
    }

    @Override
    public void onVideoCaptureStateChanged(Streamer.CaptureState state) {
        Log.d(TAG, "onVideoCaptureStateChanged, state=" + state);
        mVideoCaptureState = state;
        String message = "";
        if (mVideoCaptureState == Streamer.CaptureState.STARTED &&
                mAudioCaptureState == Streamer.CaptureState.STARTED) {
            notifyCaptureStateChange(state, "success");
        } else if (state != Streamer.CaptureState.STARTED) {
            if (state == Streamer.CaptureState.FAILED) {
                message = "errorVideo";
            } else if (state == Streamer.CaptureState.ENCODER_FAIL) {
                message = "errorVideoEncode";
            }
            notifyCaptureStateChange(state, message);
        }
    }

    @Override
    public void onAudioCaptureStateChanged(Streamer.CaptureState state) {
        Log.d(TAG, "onAudioCaptureStateChanged, state=" + state);
        mAudioCaptureState = state;
        String message = "";
        if (mVideoCaptureState == Streamer.CaptureState.STARTED &&
                mAudioCaptureState == Streamer.CaptureState.STARTED) {
            notifyCaptureStateChange(state, "success");
        } else if (state != Streamer.CaptureState.STARTED) {
            if (state == Streamer.CaptureState.FAILED) {
                message = "errorAudio";
            } else if (state == Streamer.CaptureState.ENCODER_FAIL) {
                message = "errorAudioEncode";
            }

            notifyCaptureStateChange(state, message);
        }
    }

    @Override
    public void onRecordStateChanged(Streamer.RecordState state, Uri uri, Streamer.SaveMethod method) {
        String statusStr = null;
        if (state == Streamer.RecordState.STOPPED) {
            statusStr = "success";
        } else if (state == Streamer.RecordState.STARTED) {
            statusStr = "started";
        } else if (state == Streamer.RecordState.FAILED) {
            statusStr = "failed";
        }
        if (statusStr != null) {
            WritableMap params = Arguments.createMap();
            params.putString("status", statusStr);
            if (uri != null) {
                params.putString("url", uri.toString());
                params.putString("type", "video");
                params.putString("format", "mp4");
            }
            ReactContext context = (ReactContext) getContext();

            context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit(
                    "onFileOperation", params);
        }

    }

    @Override
    public void onSnapshotStateChanged(Streamer.RecordState state, Uri uri, Streamer.SaveMethod method) {
        String statusStr = null;
        if (state == Streamer.RecordState.STOPPED) {
            statusStr = "success";
        } else if (state == Streamer.RecordState.FAILED) {
            statusStr = "failed";
        }
        if (statusStr != null) {
            WritableMap params = Arguments.createMap();
            params.putString("status", statusStr);
            if (uri != null) {
                params.putString("url", uri.toString());
                params.putString("type", "image");
                params.putString("format", "jpg");
            }
            ReactContext context = (ReactContext) getContext();

            context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit(
                    "onFileOperation", params);
        }
    }

    private List<CameraInfo> getCameraList() {
        if (mCameraList == null) {
            mCameraList = CameraRegistry.getCameraList(getContext(), mUseCamera2);
        }
        return mCameraList;
    }

    private void notifyCaptureStateChange(Streamer.CaptureState state, String statusMessage) {
        WritableMap params = Arguments.createMap();
        String stateStr = captureStateToString(state);
        params.putString("state", stateStr);
        params.putString("status", statusMessage);
        ReactContext context = (ReactContext)getContext();
        context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit(
                "onCaptureStateChanged", params);
    }

    private void notifiyConnectionStateChange(int connId, Streamer.ConnectionState state, Streamer.Status status, JSONObject info) {
        WritableMap params = Arguments.createMap();
        String stateStr = connectionStateToStr(state);
        String statusStr = connectionStatusToStr(status);

        if (info != null) {
            try {
                WritableMap infoMap = JsonConvert.jsonToReact(info);
                params.putMap("info", infoMap);
            } catch (JSONException e) {
                Log.e(TAG, "Unable to parse info");
            }
        }

        params.putInt("connectionId", connId);
        params.putString("state", stateStr);
        params.putString("status", statusStr);
        ReactContext context = (ReactContext)getContext();

        context.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class).emit(
                "onConnectionStateChanged", params);

    }

    private String captureStateToString(Streamer.CaptureState statue) {
        switch (statue) {
            case STARTED:
                return "started";
            case STOPPED:
                return "stopped";
            case FAILED:
            case ENCODER_FAIL:
                return "failed";
        }
        return "unknown";
    }

    private String connectionStateToStr(Streamer.ConnectionState state) {
        switch (state) {
            case INITIALIZED:
                return "initialized";
            case CONNECTED:
                return "connected";
            case SETUP:
                return "setup";
            case RECORD:
                return "streaming";
            case DISCONNECTED:
                return "disconnected";
            default:
                return "unknown";
        }
    }

    private String connectionStatusToStr(Streamer.Status status) {
        switch (status) {
            case SUCCESS:
                return "success";
            case CONN_FAIL:
                return "connectionFail";
            case AUTH_FAIL:
                return "authFail";
            case UNKNOWN_FAIL:
                return "unknownFail";
        }
        return "";
    }


    //Fixed updating layout in AspectFrameLayout since React refuse to re-layout:
    // https://github.com/facebook/react-native/issues/17968#issuecomment-721958427
    private Runnable refresher = () -> {
        measure(MeasureSpec.makeMeasureSpec(getWidth(), MeasureSpec.EXACTLY),
                MeasureSpec.makeMeasureSpec(getHeight(), MeasureSpec.EXACTLY));
        layout(getLeft(), getTop(), getRight(), getBottom());
    };

    @Override
    public void requestLayout() {
        super.requestLayout();
        post(refresher);
    }
}
