package com.wmspanel.reactstreamer;


import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.ActivityInfo;
import android.content.res.Configuration;
import android.util.Log;
import android.view.ViewTreeObserver;

import androidx.annotation.Nullable;

import com.facebook.react.bridge.LifecycleEventListener;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.uimanager.annotations.ReactProp;

import java.lang.ref.WeakReference;

public class StreamerViewManager extends ViewGroupManager<StreamerView>
        implements LifecycleEventListener {

    public static final String REACT_CLASS = "StreamerView";
    public static final String TAG = "StreamerViewManager";
    static WeakReference<StreamerView>mView;
    static WeakReference<Activity>mViewActivity;


    protected ReactApplicationContext mCallerContext;
    private BroadcastReceiver mReceiver;

    public static @Nullable StreamerView getView() {
        return mView == null ? null : mView.get();
    }

    public StreamerViewManager(ReactApplicationContext reactContext) {
        super();
        mCallerContext = reactContext;
        reactContext.addLifecycleEventListener(this);
        mReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                Configuration newConfig = context.getResources().getConfiguration();

                int orientation = newConfig.orientation;
                StreamerView streamer = getView();
                if (streamer != null) {
                    streamer.updateOrientation(orientation);
                }
            }
        };

    }

    @Override
    public String getName() {
        return REACT_CLASS;
    }

    @Override
    public StreamerView createViewInstance(ThemedReactContext context) {
        StreamerView view = new StreamerView(context);
        Log.d(TAG, "createViewInstance");
        if (mView != null) {
            mView.clear();
        }
        mView = new WeakReference<StreamerView>(view);
        mViewActivity = new WeakReference<>(context.getCurrentActivity());
        view.getViewTreeObserver().addOnGlobalLayoutListener(new ViewTreeObserver.OnGlobalLayoutListener() {
            @Override
            public void onGlobalLayout() {
                StreamerView view = mView.get();
                if (view != null) {
//                    if (!view.isStreamerActive()) {
//                        return;
//                    }
                    int orientation = view.initialOrientation();
                    Activity activity = context.getCurrentActivity();
                    if (activity != null && activity.getRequestedOrientation() != orientation) {
                        if (activity.equals(mViewActivity.get())) {
                            activity.setRequestedOrientation(orientation);
                        }
                    }
                }
            }
        });
        return view;
    }

    @ReactProp(name="autoStart", defaultBoolean = true)
    public void setAutoStart(StreamerView view, boolean autostart) {
        view.mAutostart = autostart;
    }

    @ReactProp(name="torch", defaultBoolean = false)
    public void setTorch(StreamerView view, boolean isOn) {
        view.setTorch(isOn);
    }

    @ReactProp(name="mute", defaultBoolean = false)
    public void setMute(StreamerView view, boolean isMute) {
        view.setSilence(isMute);
    }

    @ReactProp(name="zoom", defaultFloat = 1.0f)
    public void setZoom(StreamerView view, float zoom) {
        view.setZoom(zoom);
    }

    @ReactProp(name="statsUpdateInterval", defaultFloat = 0.0f)
    public void setUpdateInterval(StreamerView view, float interval) {
        view.setUpdateInterval(interval);
    }

    @ReactProp(name="previewScale")
    public void setScaleMode(StreamerView view, String mode) {
        view.setResizeMode(mode);
    }

    @ReactProp(name="cameraId")
    public void setCamera(StreamerView view, String cameraId) {
        if (cameraId == null || cameraId.isEmpty()) {
            return;
        }
        if (cameraId.equals("back") || cameraId.equals("front") ) {
            view.setCamera("", cameraId);
            return;
        }
//        int sepPos = cameraId.indexOf("#");
//        String position = "";
//        String camId = "";
//        if (sepPos > 0) {
//            position = cameraId.substring(0, sepPos - 1);
//        } else {
//            position = cameraId;
//        }
//        if (sepPos > 0) {
//            camId = cameraId.substring(sepPos+1);
//        }
        view.setCamera(cameraId, "");
    }

    @ReactProp(name="videoConfig")
    public void setVideoConfig(StreamerView view, ReadableMap config) {

        if (config.hasKey("orientation")) {
            String orientation = config.getString("orientation");
            view.mVerticalVideo = orientation.equals("portrait");
        }
        if (config.hasKey("apiVersion")) {
            int camVersion = config.getInt("apiVersion");
            if (camVersion == 1) {
                view.mUseCamera2 = false;
            } else if (camVersion == 2) {
                view.mUseCamera2 = true;
            }
        }
        view.setVideoConfig(config);
    }

    @ReactProp(name="audioConfig")
    public void setAudioConfig(StreamerView view, ReadableMap config) {
        view.setAudioConfig(config);
    }

    @Override
    public void onHostResume() {
        Log.d(TAG, "onHostResume");

        final Activity activity = mCallerContext.getCurrentActivity();
        StreamerView view = getView();
        int orientation = ActivityInfo.SCREEN_ORIENTATION_SENSOR;
        if (view != null) {
            view.onResume();
            orientation = view.initialOrientation();
        }
        if (activity != null) {
            activity.setRequestedOrientation(orientation);
            IntentFilter intentFilter = new IntentFilter();
            intentFilter.addAction(Intent.ACTION_CONFIGURATION_CHANGED);
            activity.registerReceiver(mReceiver, intentFilter);
        }
    }

    @Override
    public void onHostPause() {
        Log.d(TAG, "onHostPause");
        StreamerView view = getView();
        if (view != null) {
            view.onPause();
        }

        final Activity activity = mCallerContext.getCurrentActivity();
        if (activity != null) {
            try {
                activity.unregisterReceiver(mReceiver);
            } catch (java.lang.IllegalArgumentException e) {
                Log.w(TAG, "receiver already unregistered", e);
            }
        }


    }

    @Override
    public void onHostDestroy() {
        Log.d(TAG, "onHostDestroy");
        mView.clear();
    }
}
