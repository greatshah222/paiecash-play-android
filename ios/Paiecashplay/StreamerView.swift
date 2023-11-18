import Foundation
import UIKit
import AVKit

import LarixCore
import LarixStream
import LarixUI

public protocol StreamerManagerProxy {
    func emitEvent(_ name: String, params: [AnyHashable: Any])
}

@objc
public class StreamerView: UIView, StreamerAppDelegate {
    
    public var streamerManagerProxy: StreamerManagerProxy?
    
    static var lockedOrientation: UIInterfaceOrientationMask = .all
    
    //To be called from AppDelegate. Please add following method there:
    //- (UIInterfaceOrientationMask)application:(UIApplication *)application supportedInterfaceOrientationsForWindow:(UIWindow *)window {
    //  return [StreamerView getLockedOrientation];
    //}
    
    @objc public static func getLockedOrientation() -> UIInterfaceOrientationMask {
        return Self.lockedOrientation
        
    }
    
    @objc public var autoStart: Bool = false {
        didSet {
            if autoStart {
                startCapture()
            }
        }
    }

    @objc public var torch: Bool = false {
        didSet {
            guard let streamer = streamer else {
                return
            }
            let isOn = streamer.flashOn()
            if isOn != torch {
                _ = streamer.toggleFlash()
            }
        }
    }

    @objc public var mute: Bool = false {
        didSet {
            guard let streamer = streamer else {
                return
            }
            streamer.isMuted = mute
        }
    }

    @objc public var zoom: NSNumber = NSNumber(floatLiteral: 1.0) {
        didSet {
            let val = CGFloat(zoom.floatValue)
            if val > 0 {
                streamer?.zoomTo(factor: val)
            }
        }
    }
    
    @objc public var statsUpdateInterval: NSNumber = 0.0 {
        didSet {
            setStatsTimer()
        }
    }
    
    @objc public var cameraId: NSString = "back" {
        didSet {
            let settings = Settings.sharedInstance
            settings.cameraId = String(cameraId)
            if captureState == .started, let streamer = streamer {
                if let camera = Settings.sharedInstance.getCameraById(settings.cameraId) {
                    streamer.changeCamera(to: camera)
                }
            }
        }
    }
    
    @objc public var videoConfig: NSDictionary = [:] {
        didSet {
            Settings.sharedInstance.parseVideoConfig(config: videoConfig)
        }
    }
    
    func setStatsTimer() {
        let intervalF = statsUpdateInterval.doubleValue
        if intervalF > 0.0 {
            uiTimer = Timer.scheduledTimer(timeInterval: intervalF, target: self, selector: #selector(updateInfo), userInfo: nil, repeats: true)
        } else {
            uiTimer?.invalidate()
        }

    }
    
    @objc public var audioConfig: NSDictionary = [:] {
        didSet {
            Settings.sharedInstance.parseAudioConfig(config: audioConfig)

        }
    }
    
    @objc public var previewScale: String = "fill" {
        didSet {
            let settings = Settings.sharedInstance
            settings.parseVideoGravity(previewScale)
            previewLayer?.fillMode = settings.displayLayerGravity
        }
    }

    
    var streamer: Streamer?
    var uiTimer: Timer?

    var previewLayer: PreviewLayer?
    var canStartCapture: Bool = false
    var connections: [Int32] = []
    var connectionState:[Int32:ConnectionState] = [:] // id -> ConnectionState
    var connectionStatistics = StreamerStats()
    private var captureState: CaptureState = .setup
    
    var isBroadcasting = false
    var broadcastStartTime: CFTimeInterval = CACurrentMediaTime()
    
    var mediaResetPending = false
    var lostMic = false
    var restoreFromBackground: Bool = false

    override init(frame:CGRect) {
        super.init(frame: frame)
        canStartCapture = true
    }
    
    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    
    @objc public  func applicationDidBecomeActive() {
        if restoreFromBackground {
            startCapture()
            restoreFromBackground = false
        }
    }
    
    
    @objc public func applicationWillResignActive() {
        restoreFromBackground = streamer?.active ?? false
        stopBroadcast()
        removePreview()
        stopCapture()
    }
    
    public override func removeFromSuperview() {
        stopBroadcast()
        removePreview()
        stopCapture()
        super.removeFromSuperview()
    }
    
    // MARK: Respond to the media server crashing and restarting
    // https://developer.apple.com/library/archive/qa/qa1749/_index.html

    @objc public func mediaServicesWereLost() {
        mediaResetPending = streamer?.active == true
        stopBroadcast()
        removePreview()
        stopCapture()
    }
    
    @objc public func mediaServicesWereReset() {
        if mediaResetPending {
            startCapture()
            mediaResetPending = false
        }
    }
    
    override public func layoutSubviews() {
        super.layoutSubviews()
        if let previewLayer = previewLayer {
            previewLayer.frame = bounds
         }
    }
    
    @objc public func startCapture() {
        guard canStartCapture else {
            return
        }
        canStartCapture = false
        if streamer == nil {
            let settings = Settings.sharedInstance
            let builder = StreamerBuilder()
            builder.delegate = self
            builder.videoConfig = settings.videoConfig
            builder.audioConfig = settings.audioConfig

            streamer = builder.build()
        }
        lockOrientation()
        removePreview()
        guard let streamer = streamer else {
            return
        }
        updateStreamerOrientation()

        do {
            try streamer.startCapture(startAudio: true, startVideo: true)

            let nc = NotificationCenter.default
            nc.addObserver(
                self,
                selector: #selector(orientationDidChange(notification:)),
                name: UIDevice.orientationDidChangeNotification,
                object: nil)

        } catch {
            NSLog("can't start capture: \(error.localizedDescription)")
            if let err = error as? CaptureStatus {
                captureStateDidChange(state: .failed, status: err)
            }
            canStartCapture = true
        }
    }
    
    @objc public func stopCapture() {
        guard let streamer = streamer else {
            return
        }
        streamer.stopRecord()
        streamer.stopCapture()
        self.streamer = nil
        canStartCapture = true
        lockOrientation()

        let nc = NotificationCenter.default
        nc.removeObserver(self)
    }

    //MARK: Start streaming
    @objc public func startBroadcast(_ dest: NSString) -> Int32 {
        broadcastWillStart()
        let connectionId = createConnection(dest)
        if connectionId >= 0 {
            connections.append(connectionId)
        }
        return connectionId
    }

    @objc public func startBroadcast(config dest: NSArray) -> [NSNumber] {
        broadcastWillStart()
        guard let destArray = dest as? Array<NSDictionary> else {
            return []
        }
        let idList: [NSNumber] = destArray.map { config in
            let connectionId = createConnection(nil, settings: config)
            if connectionId >= 0 {
                connections.append(connectionId)
            }
            return NSNumber(integerLiteral: Int(connectionId))

        }
        return idList

    }

    @objc public func stopBroadcast() {
        broadcastWillStop()
        for connectionId in connections {
            self.streamer?.releaseConnection(id: connectionId)
        }
    }

    func broadcastWillStart() {
        if !isBroadcasting {
            NSLog("start broadcasting")
           
            updateStreamerOrientation()
            broadcastStartTime = CACurrentMediaTime()
            isBroadcasting = true
            lockOrientation()
            setStatsTimer()
            
        }
    }
    
    func broadcastWillStop() {
        if isBroadcasting {
            NSLog("stop broadcasting")
            
            isBroadcasting = false
            uiTimer?.invalidate()
            lockOrientation()
        }
    }

    
    @objc public func disconnect(_ connId: Int32) {
        //connections.removeAll { $0 == connId }
        if connections.contains(connId) {
            self.streamer?.releaseConnection(id: connId)
        }
    }

    
    // MARK: Connection utitlites
    @objc public func createConnection(_ urlTo: NSString?, settings: NSDictionary? = nil) -> Int32 {
        var connId: Int32 = -1
        
        guard let urlStr = urlTo ?? settings?.object(forKey: "url") as? NSString else {
            NSLog("No URL provided")
            return -1
        }
        let mode = settings?.object(forKey: "mode") as? NSString ?? "av"
        var connMode: ConnectionMode = .videoAudio
        if mode == "a" || mode == "audio" {
            connMode = .audioOnly
        } else if mode == "v" || mode == "video" {
            connMode = .videoOnly
        }
        

        guard let streamer = streamer, let url = URL(string: urlStr as String) else {
            NSLog("Invalid URL")
            return -1
        }
        guard let scheme = url.scheme, let host = url.host else {
            NSLog("URL doesn't contain scheme or host")
            return -1
        }
        var isUdp = false
        let port = url.port
        if scheme.hasPrefix("rtmp") || scheme.hasPrefix("rtsp") {
            let config = ConnectionConfig()
            if let settings = settings {
                config.setup(from: settings)
            } else {
                config.uri = url
            }
            connId = streamer.createConnection(config: config)
        } else if scheme == "srt" {
            let srtConfig = SrtConfig()
            if let settings = settings {
                srtConfig.setup(from: settings)
            } else {
                srtConfig.host = host
                srtConfig.port = Int32(port ?? 0)
            }
            connId = streamer.createConnection(config: srtConfig)
            isUdp = true
        } else if scheme == "rist" {
            let config = RistConfig()
            config.uri = url
            config.mode = connMode
            connId = streamer.createConnection(config: config)
            isUdp = true
        } else {
            NSLog("Unsupported protocol")
        }
        if connId > 0 {
            connectionState[connId] = .disconnected
            connectionStatistics.addConnection(connId: connId, isUdp: isUdp)
        }

        NSLog("Create connection: \(connId), \(urlStr)" )
        return connId
        
        
    }
    
    @objc public func takeSnapshot(name: NSString?) {
        let tmpPath = FileManager.default.temporaryDirectory
        let filename: String
        if let nameOpt = name, nameOpt.length > 0 {
            filename = String(nameOpt)
        } else {
            let df = DateFormatter()
            df.dateFormat = "yyyyMMddHHmmss"
            filename = "IMG_" + df.string(from: Date()) + ".jpg"
        }
        let path = tmpPath.appendingPathComponent(filename)
        streamer?.captureStillImage(fileUrl: path, format: .jpg)
    }

    func releaseConnection(_ connId: Int32) {
        if (connId >= 0) {
            if let pos = connections.firstIndex(of: connId) {
                connections.remove(at: pos)
            }
            connectionStatistics.removeConnection(connId: connId)
            connectionState.removeValue(forKey: connId)
            streamer?.releaseConnection(id: connId)
        }
    }
    
    @objc public func startRecord(name: NSString?) {
        guard let streamer = streamer else {
            return
        }

        let tmpPath = FileManager.default.temporaryDirectory
        let filename: String
        if let nameOpt = name, nameOpt.length > 0 {
            filename = String(nameOpt)
        } else {
            let df = DateFormatter()
            df.dateFormat = "yyyyMMddHHmmss"
            filename = "MVI_" + df.string(from: Date()) + ".mov"
        }
        let path = tmpPath.appendingPathComponent(filename)
        if streamer.isWriting {
            streamer.switchRecord(nextFileUrl: path)
        } else {
            streamer.startRecord(url: path)
        }
    }
    
    @objc public func stopRecord() {
        streamer?.stopRecord()
    }
    

    func removePreview() {
        previewLayer?.removeFromSuperview()
        previewLayer = nil
    }
    
    func lockOrientation() {
        let currentOrientaion =  UIApplication.shared.statusBarOrientation

        let settings = Settings.sharedInstance
        var newOrientaion: UIInterfaceOrientationMask = .all
        if settings.postprocess == true && settings.liveRotation == false && isBroadcasting {
            switch currentOrientaion {
            case .unknown:
                newOrientaion = .all
            case .portrait:
                newOrientaion = .portrait
            case .portraitUpsideDown:
                newOrientaion = .portraitUpsideDown
            case .landscapeLeft:
                newOrientaion = .landscapeLeft
            case .landscapeRight:
                newOrientaion = .landscapeRight
            @unknown default:
                newOrientaion = .all
            }
        } else if streamer != nil && settings.postprocess == false {
            newOrientaion = settings.portrait ?
                UIInterfaceOrientationMask.portrait : UIInterfaceOrientationMask.landscapeRight
        }
        let currentOrientation = Self.lockedOrientation
        if currentOrientation == newOrientaion {
            return
        }
        Self.lockedOrientation = newOrientaion

        let uiDevice = UIDevice.current
        let orientationKey = "orientation"
        let unknownOrienation = NSNumber(integerLiteral: UIDeviceOrientation.unknown.rawValue)
        let deviceOrientation =  NSNumber(integerLiteral: currentOrientaion.rawValue)
        uiDevice.setValue(unknownOrienation, forKey: orientationKey)
        if (streamer != nil && settings.postprocess == false) {
            let newValue = settings.portrait ? UIInterfaceOrientation.portrait.rawValue : UIInterfaceOrientation.landscapeRight.rawValue
            uiDevice.setValue(NSNumber(integerLiteral: newValue), forKey: orientationKey)
        }
        uiDevice.setValue(deviceOrientation, forKey: orientationKey)
        UIViewController.attemptRotationToDeviceOrientation()
    }
    
    @objc public func orientationDidChange(notification: Notification) {
        guard let previewLayer = previewLayer else {
            return
        }


        let deviceOrientation = UIApplication.shared.statusBarOrientation
        if let newOrientation = AVCaptureVideoOrientation(rawValue: deviceOrientation.rawValue) {
            previewLayer.videoOrientation = newOrientation
            let postprocess = Settings.sharedInstance.postprocess
            if postprocess {
                if Settings.sharedInstance.liveRotation {
                    streamer?.orientation = newOrientation
                }
            }

        }
    }
    
    internal func updateStreamerOrientation() {
        let deviceOrientation = UIApplication.shared.statusBarOrientation
        let newOrientation = AVCaptureVideoOrientation(rawValue: deviceOrientation.rawValue) ?? .portrait
        streamer?.orientation = newOrientation
        
    }
    
    public func connectionStateDidChange(id: Int32, state: ConnectionState, status: ConnectionStatus, info: [AnyHashable : Any]!) {
        DispatchQueue.main.async {
            self.onConnectionStateChange(connId: id, state: state, status: status, info: info)
        }
    }
    
    public func onConnectionStateChange(connId: Int32, state: ConnectionState, status: ConnectionStatus, info: [AnyHashable:Any]!) {
        NSLog("connectionStateDidChange id:\(connId) state:\(state.rawValue) status:\(status.rawValue)")
        guard connections.contains(connId),
              let proxy = streamerManagerProxy else {
            return
        }
        if state == .disconnected {
            releaseConnection(connId)
        } else {
            connectionState[connId] = state
        }
        
        let stateStr = state.code as NSString
        let statusStr = status.code as NSString
        
        var infoStr: NSString?
        if let info = info, info.count > 0 {
            do {
                let jsonData = try JSONSerialization.data(withJSONObject: info)
                infoStr = String(data: jsonData, encoding: .utf8) as NSString?
            } catch {
            }
        }
        var data = ["connectionId": connId,
                    "state": stateStr,
                    "status": statusStr
        ] as [AnyHashable: Any]
        if infoStr != nil {
            data["info"] = infoStr
        }
        proxy.emitEvent("onConnectionStateChanged", params: data)
    }
    
    public func captureStateDidChange(state: CaptureState, status: Error) {

        if let captureStatus = status as? CaptureStatus {
            DispatchQueue.main.async {
                self.onCaptureStateChange(state: state, status: captureStatus)
            }
        }
    }
    
    func onCaptureStateChange(state: CaptureState, status: CaptureStatus) {
        let stateStr = state.code as NSString
        let statusStr = status.code as NSString
        captureState = state
        switch (state) {
        case .started:
            previewLayer = streamer?.createPreviewLayer(parentView: self)
            previewLayer?.fillMode = Settings.sharedInstance.displayLayerGravity

            
        case .failed where streamer == nil:
            return
        case .failed where status == .errorMicInUse:
            NSLog("Lost mic access, pausing")
            lostMic = true
        case .failed:
            stopBroadcast()
            removePreview()
            stopCapture()

        case .canRestart:
            if autoStart && !lostMic {
                startCapture()
            }
        case .setup, .stopped:
            //No special handling
            break
        }
        if let proxy = streamerManagerProxy {
            let data = ["state": stateStr,
                        "status": statusStr
            ] as [AnyHashable: Any]
            proxy.emitEvent("onCaptureStateChanged", params: data)

        }
    }
    
    public func notification(notification: StreamerNotification) {
        let streamer = streamer
        let camInfo = streamer?.getActiveCameraInfo()
        guard let proxy = streamerManagerProxy else {
            return
        }
        if notification == .ActiveCameraDidChange {
            if let firstCam = camInfo?.first {
                let res = firstCam.recordSize
                let resStr = String(format: "%dx%d", res.width, res.height)
                let info: [String : Any] = [
                    "id": firstCam.cameraId,
                    "deviceType": firstCam.deviceType,
                    "lensFacing": firstCam.lensFacing,
                    "recordSize": resStr,
                    "fps": NSNumber(floatLiteral: firstCam.fps),
                    "isTorchSupported": NSNumber(booleanLiteral: firstCam.isTorchSupported)
                ]
                proxy.emitEvent("onCameraChanged", params: info)
            }
        } else if notification == .ChangeCameraFailed || notification == .FrameRateNotSupported {
            let msg = notification == .ChangeCameraFailed ? "changeCameraFailed" :  "frameRateNotSupported"
            let camId = camInfo?.first?.cameraId ?? "0"
            let info: [String: Any] = [
                "error": msg,
                "id": camId
            ]
            proxy.emitEvent("onCameraChanged", params: info)
        }

    }
    
    public func snapshotStateDidChange(state: RecordState, fileUrl: URL?) {
        let statusStr = state.code
        guard let proxy = streamerManagerProxy else {
            NSLog("No file handler")
            return
        }
        var message: [String: Any] = [
            "status": statusStr,
            "type": "image",
            "format": "jpg",
        ]
        if let path = fileUrl?.path {
            message["url"] = path
        }
        proxy.emitEvent("onFileOperation", params: message)

    }
    
    public func recordStateDidChange(state: RecordState, fileUrl: URL?) {
        guard let proxy = streamerManagerProxy else {
            NSLog("No file handler")
            return
        }
        let statusStr = state.code
        var message: [String: Any] = [
            "status": statusStr,
            "type": "video",
            "format": "mov"
        ]
        if let path = fileUrl?.path {
            message["url"] = path
        }
        proxy.emitEvent("onFileOperation", params: message)
    }
    
    
    func lockModeChanged() {
        //TODO: handle changes
    }

    // MARK: Connection status UI
    @objc public func updateInfo() {
        guard let streamer = streamer else {
            return
        }

        for id in connections {
            guard let state = connectionState[id], state == .record else {
                continue
            }
            connectionStatistics.update(connId: id, streamer: streamer)

        }
        sendConnectionStats()
    }
    
    func sendConnectionStats() {
        guard let proxy = streamerManagerProxy else {
            return
        }
        
        var data: [String: Any] = [:]
        for connId in connections {
            guard let stats = connectionStatistics.get(connId) else {
                continue
            }
            var connStats: [String: Any] = [
                "duration": stats.duration,
                "bytesDelivered": stats.prevBytesDelivered,
                "bytesSent": stats.prevBytesDelivered,
                "bitrate": stats.bps
            ]
            if stats.isUdp {
                connStats["packetsLost"] = stats.packetsLost
            } else {
                connStats["latency"] = stats.latency

            }
            let connIdStr = String(format: "%d", connId)
            data[connIdStr] = connStats
        }
        proxy.emitEvent("onStreamerStats", params: data)
        
    }

}
