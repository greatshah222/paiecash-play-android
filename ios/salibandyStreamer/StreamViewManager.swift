import Foundation
import LarixStream

@objc(StreamerViewManager) public
class StreamViewManager: RCTViewManager, AudioSessionStateObserver {
    private var audioSession: AudioSession
    weak var streamerView: StreamerView?
    var proxy: StreamerManagerProxy?
    
    @objc override init() {
        audioSession = AudioSession()
        super.init()
        audioSession.observer = self
        audioSession.start()
        let nc = NotificationCenter.default
        nc.addObserver(self,
                       selector: #selector(applicationDidBecomeActive),
                       name: UIApplication.didBecomeActiveNotification,
                       object: nil)
        nc.addObserver(self,
                       selector: #selector(applicationWillResignActive),
                       name: UIApplication.willResignActiveNotification,
                       object: nil)


    }
    
    @objc func getStreamer() -> StreamerView? {
        return streamerView
    }
    
    @objc func applicationDidBecomeActive() {
        audioSession.start()
        streamerView?.applicationDidBecomeActive()
    }
    
    @objc func applicationWillResignActive() {
        streamerView?.applicationWillResignActive()
        audioSession.stop()
    }
    
    public func mediaServicesWereLost() {
        streamerView?.mediaServicesWereLost()
    }
    
    public func mediaServicesWereReset() {
        streamerView?.mediaServicesWereReset()
    }
    
    @objc public override static func requiresMainQueueSetup() -> Bool {
        return true
    }
    
    public override func view() -> UIView! {
        let res = StreamerView()
        res.streamerManagerProxy = proxy
        streamerView = res
        return res
    }
}
