import Foundation
import LarixStream
import LarixSupport

@objc(LarixStreamer)
class LarixStreamer: RCTEventEmitter, StreamerManagerProxy, PermissionCheckerDelegate {
    private var checker: PermissionChecker? = nil
    private var onGranted: RCTPromiseResolveBlock? = nil
    private var onRejected: RCTPromiseRejectBlock? = nil
    private var hasListeners: Bool = false
    private var camManager = CameraManager()
    
    public override func startObserving() {
        hasListeners = true
        let mainQueue = bridge.uiManager.methodQueue
        mainQueue?.async {
            if let viewManager = self.bridge.module(forName: "StreamerViewManager") as? StreamViewManager {
                viewManager.proxy = self
            }
        }
    }

    // Will be called when this module's last listener is removed, or on dealloc.
    public override func stopObserving() {
        hasListeners = false
        if let viewManager = self.bridge.module(forName: "StreamerViewManager") as? StreamViewManager {
            viewManager.proxy = nil
        }
    }
    
    public override static func requiresMainQueueSetup() -> Bool {
        return true
    }
    
    
    public override func supportedEvents() -> [String]! {
        let events = [
            "onConnectionStateChanged",
            "onCaptureStateChanged",
            "onCameraChanged",
            "onStreamerStats",
            "onFileOperation"]
        return events
    }
    
    @objc func requestPermissions(_ resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        if (checker == nil) {
            let mode: Set<PermissionCheckItem> = [.camera, .microphone, .photoLibrary]
            checker = PermissionChecker(mode)
            checker?.setDelegate(self)
        }
        onGranted = resolver
        onRejected = rejecter
        checker?.check()

    }

    @objc func getCameraInfo(_ androidApi: NSNumber, callback: RCTResponseSenderBlock) {
        let camInfo = camManager.getCameraListObj()
        callback([camInfo])
    }
    
    @objc func startCapture() {
        runOnStreamer { streamer in
            streamer.startCapture()
        }
    }
    
    @objc func stopCapture() {
        NSLog("stopCapture")
        runOnStreamer { streamer in
            streamer.stopCapture()
        }
    }

    @objc func connectTo(_ url: NSString, callback: @escaping RCTResponseSenderBlock) {
        NSLog("Connecting to %@", url);
        runOnStreamer { streamer in
            let connId = streamer.startBroadcast(url)
            let connList = [connId]
            callback([connList])
        }
    }

    @objc func connect(_ params: NSArray, callback: @escaping RCTResponseSenderBlock) {
        runOnStreamer { streamer in
            let connLit = streamer.startBroadcast(config: params)
            callback([connLit])
        }
    }


    @objc func disconnect(_ connId: NSNumber) {
        runOnStreamer { streamer in
            streamer.disconnect(connId.int32Value)
        }
    }

    @objc func disconnectAll() {
        NSLog("Disconnecting ")
        runOnStreamer { streamer in
            streamer.stopBroadcast()
        }
    }

    @objc func takeSnapshot(_ name: NSString?) {
        runOnStreamer { streamer in
            streamer.takeSnapshot(name: name)
        }
    }

    @objc func startRecord(_ name: NSString?){
        runOnStreamer { streamer in
            streamer.startRecord(name: name)
        }
    }
    
    @objc func stopRecord() {
        runOnStreamer { streamer in
            streamer.stopRecord()
        }

    }


    func runOnStreamer(callback: (@escaping (_ streamerView: StreamerView) -> Void)) {
        DispatchQueue.main.async {
            guard let viewManager = self.bridge.module(forName: "StreamerViewManager") as? StreamViewManager,
                  let streamer = viewManager.getStreamer() else {
                      return
                  }
            callback(streamer)

        }
    }

    public func emitEvent(_ name: String, params: [AnyHashable: Any]) {
        if hasListeners, let events = supportedEvents(), events.contains(name) {
            sendEvent(withName: name, body: params)
        } else {
            NSLog("Unknown event: %@", name);
        }
    }

    public func permissionsGranted() {
        if let callback = onGranted {
            callback([1])
        }
    }

    public func permissionsMissing(_ item: PermissionCheckItem) {
        guard let callback = onRejected else {
            return
        }
        if (item == .camera) {
            callback("cam", "Camera permission missing", nil)
        } else if (item == .microphone) {
            callback("mic", "Microphone permission missing", nil)
        }

    }
    
}
