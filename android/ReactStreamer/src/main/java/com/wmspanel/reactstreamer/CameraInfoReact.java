package com.wmspanel.reactstreamer;

import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeArray;
import com.facebook.react.bridge.WritableNativeMap;
import com.wmspanel.libstream.Streamer;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import com.wmspanel.libcommon.CameraInfo;

public final class CameraInfoReact {

    public static WritableMap toReactMap(CameraInfo info) {
        WritableNativeMap infoMap = new WritableNativeMap();
        String facing;
        if (info.lensFacing == CameraInfo.LENS_FACING_FRONT) {
            facing = "front";
        } else if (info.lensFacing == CameraInfo.LENS_FACING_BACK)  {
            facing = "back";
        } else {
            facing = "unspecified";
        }
        infoMap.putString("cameraId", info.cameraId);
        infoMap.putString("lensFacing", facing);
        infoMap.putBoolean("isTorchSupported", info.isTorchSupported);
        WritableNativeArray resArray = new WritableNativeArray();
        for(Streamer.Size res: info.recordSizes) {
            String resStr = String.format("%dx%d", res.width, res.height);
            resArray.pushString(resStr);
        }
        infoMap.putArray("recordSizes", resArray);
        WritableNativeArray fpsArray = new WritableNativeArray();
        for(Streamer.FpsRange range: info.fpsRanges) {
            String rangeStr;
            if (range.fpsMin == range.fpsMax) {
                rangeStr = String.format("%d", range.fpsMax);
            } else {
                rangeStr = String.format("%d-%d", range.fpsMin, range.fpsMax);
            }
            fpsArray.pushString(rangeStr);
        }
        infoMap.putArray("fpsRanges", fpsArray);
        if (info.isZoomSupported) {
            infoMap.putDouble("maxZoom", info.maxZoom);
        }
        return infoMap;
    }

    public static Map<String, CameraInfo> toMap(List<CameraInfo> cameraList) {
        // LinkedHashMap presents the items in the insertion order
        final Map<String, CameraInfo> map = new LinkedHashMap<>();
        for (CameraInfo info : cameraList) {
            map.put(info.cameraId, info);
            for (CameraInfo subInfo : info.physicalCameras) {
                map.put(info.cameraId.concat(subInfo.cameraId), subInfo);
            }
        }
        return map;
    }

}
