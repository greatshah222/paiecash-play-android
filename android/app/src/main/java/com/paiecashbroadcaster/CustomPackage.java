package com.paiecashbroadcaster;

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager; // Import ViewManager

import java.util.List;
import java.util.Arrays; // Make sure this import is present
import java.util.ArrayList;


public class CustomPackage implements ReactPackage {
    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        List<NativeModule> modules = new ArrayList<>();
        modules.add(new ScreenOrientationModule(reactContext)); // Add your module here
        return modules;
    }


      @Override
    public List<ViewManager> createViewManagers(ReactApplicationContext reactContext) {
        return new ArrayList<>(); // Return an empty list for now
    }
}
