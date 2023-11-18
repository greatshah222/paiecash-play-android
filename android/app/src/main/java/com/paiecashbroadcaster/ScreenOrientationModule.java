// ScreenOrientationModule.java
package com.paiecashbroadcaster;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import android.content.pm.ActivityInfo;

public class ScreenOrientationModule extends ReactContextBaseJavaModule {
  public ScreenOrientationModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  public String getName() {
    return "ScreenOrientationModule";
  }

  @ReactMethod
  public void setOrientation(String orientation) {
    if (orientation.equals("portrait")) {
      getCurrentActivity().setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
    } else if (orientation.equals("landscape")) {
      getCurrentActivity().setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE);
    }
  }
}
