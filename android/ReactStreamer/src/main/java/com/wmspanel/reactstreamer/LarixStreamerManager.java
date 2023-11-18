package com.wmspanel.reactstreamer;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.util.Log;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableArray;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.bridge.WritableNativeMap;
import com.facebook.react.modules.core.PermissionAwareActivity;
import com.facebook.react.modules.core.PermissionListener;

import com.wmspanel.libcommon.CameraInfo;
import com.wmspanel.libcommon.CameraRegistry;

import java.io.File;
import java.util.ArrayList;
import java.util.List;

public class LarixStreamerManager extends ReactContextBaseJavaModule
        implements PermissionListener {
    final static String TAG = "LarixStreamer";
    private static final int CAMERA_REQUEST = 1;
    private Promise permissionPromise;

    LarixStreamerManager(ReactApplicationContext context) {
        super(context);
    }

    @Override
    public String getName() {
        return "LarixStreamer";
    }

    @ReactMethod
    public void getCameraInfo(Integer apiVersion, Callback callback) {
        WritableNativeMap result = new WritableNativeMap();
        Context context = getReactApplicationContext();
        boolean isUsingCam2 = SettingsUtils.isUsingCamera2(context);
        if (isUsingCam2 && apiVersion == 1) {
            isUsingCam2 = false;
        }
        final List<CameraInfo> cameraList = CameraRegistry.getCameraList(context, isUsingCam2);

        if (cameraList == null || cameraList.size() == 0) {
            result.putString("error", "no_camera");
            callback.invoke(result);
        }
        WritableNativeArray cameraInfo = new WritableNativeArray();
        for(CameraInfo info: cameraList) {
            final ReadableMap infoMap = CameraInfoReact.toReactMap(info);
            cameraInfo.pushMap(infoMap);
        }
        result.putArray("cameraInfo", cameraInfo);
        callback.invoke(result);

    }

    @ReactMethod
    public void startCapture() {
        StreamerView streamer = StreamerViewManager.getView();
        if (streamer != null) {
            streamer.createStreamer();
        }
    }

    @ReactMethod
    public void stopCapture() {
        StreamerView streamer = StreamerViewManager.getView();
        if (streamer != null) {
            streamer.releaseStreamer();
        }
    }

    @ReactMethod
    public void connectTo(String urlStr, Callback callback){
        StreamerView streamer = StreamerViewManager.getView();
        Integer result = -1;
        if (streamer != null) {
            result = streamer.connectTo(urlStr, null);
        } else {
            Log.w(TAG, "No StreamerView instance");
        }
        callback.invoke(result);
    }

    @ReactMethod
    public void connect(ReadableArray config, Callback callback){
        StreamerView streamer = StreamerViewManager.getView();
        if (streamer != null) {
            streamer.setLockedOrientation(true, getCurrentActivity());

            WritableArray res = new WritableNativeArray();
            for(int i= 0; i < config.size(); i++) {
                ReadableMap params = config.getMap(i);
                int id = -1;
                if (params != null) {
                    id = streamer.connectTo(null, params);
                }
                res.pushInt(id);
            }
            callback.invoke(res);

        } else {
            Log.w(TAG, "No StreamerView instance");
            Integer result = -1;
            callback.invoke(result);
        }
    }

    @ReactMethod
    public void disconnect(Integer connectionId) {
        StreamerView streamer = StreamerViewManager.getView();
        if (streamer != null) {
            streamer.releaseConnection(connectionId);
        } else {
            Log.w(TAG, "No StreamerView instance");
        }
    }

    @ReactMethod
    public void disconnectAll() {
        StreamerView streamer = StreamerViewManager.getView();
        if (streamer != null) {
            streamer.disconnectAll();
            streamer.setLockedOrientation(false, getCurrentActivity());
        }
    }

    @ReactMethod
    public void takeSnapshot(String filename) {
        StreamerView streamer = StreamerViewManager.getView();
        Context context = getReactApplicationContext();

        File tmpDir = context.getCacheDir();
        if (streamer != null) {
            streamer.takeSnapshot(tmpDir, filename);
        }
    }

    @ReactMethod
    public void startRecord(String filename) {
        StreamerView streamer = StreamerViewManager.getView();
        Context context = getReactApplicationContext();

        File tmpDir = context.getCacheDir();
        if (streamer != null) {
            streamer.startRecord(tmpDir, filename);
        }
    }

    @ReactMethod
    public void stopRecord() {
        StreamerView streamer = StreamerViewManager.getView();
        if (streamer != null) {
            streamer.stopRecord();
        }
    }



    @ReactMethod
    public void requestPermissions(Promise promise) {
        PermissionAwareActivity activity = (PermissionAwareActivity) getCurrentActivity();
        if (activity == null) {
            promise.reject("err", "Failed to request permissions");
        }
        int cameraPerm = 0;
        String[] permission = {
                Manifest.permission.CAMERA,
                Manifest.permission.RECORD_AUDIO,
                // Manifest.permission.WRITE_EXTERNAL_STORAGE,
                Manifest.permission.ACCESS_MEDIA_LOCATION};

        List<String> toRequest = new ArrayList<>();
        for (String perm: permission) {
            boolean enabled = activity.checkSelfPermission(perm) == PackageManager.PERMISSION_GRANTED;
            if (!enabled) {
                toRequest.add(perm);
            }
        }
        if (toRequest.isEmpty()) {
            Integer success = new Integer(1);
            promise.resolve(success);
            return;
        }
        String[] requestArr = new String[toRequest.size()];
        toRequest.toArray(requestArr);
        permissionPromise = promise;
        activity.requestPermissions(requestArr, CAMERA_REQUEST, this);

    }

    @Override
    public boolean onRequestPermissionsResult(int requestCode,
                                              String permissions[], int[] grantResults) {
        if (requestCode == CAMERA_REQUEST && permissionPromise != null) {
            for (int i = 0; i < permissions.length; i++) {
                int result = grantResults[i];
                if (result == PackageManager.PERMISSION_DENIED) {
                    String permission = permissions[i];
                    if (permission.equals(Manifest.permission.ACCESS_MEDIA_LOCATION)) {
                        //Don't know why it's not even requested
                        continue;
                    }
                    if (permission.equals(Manifest.permission.CAMERA)) {
                        permissionPromise.reject("Cam", "No camera");
                    } else if (permission.equals(Manifest.permission.RECORD_AUDIO)) {
                        permissionPromise.reject("Mic", "No microphone");
                    }

                    permissionPromise = null;
                    return true;
                }
            }
            Integer success = new Integer(1);
            permissionPromise.resolve(success);
            permissionPromise = null;
            return true;
        }
        return false;
    }

}
