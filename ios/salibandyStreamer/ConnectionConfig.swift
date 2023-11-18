import Foundation
import LarixCore

extension ConnectionMode {
    init(from str: String) {
        if str == "a" || str == "audio" {
            self = .audioOnly
        } else if str == "v" || str == "video" {
            self = .videoOnly
        } else {
            self = .videoAudio
        }
    }
}

extension ConnectionConfig {

    func setup(from config: NSDictionary){
        if let urlStr = config.object(forKey: "url") as? String,
           let url = URL(string: urlStr) {
            self.uri = url
        }
        if let mode = config.object(forKey: "mode") as? String {
            self.mode = ConnectionMode(from: mode)
        }

        if let authStr = config.object(forKey: "target") as? String {
            auth = authMode(authStr: authStr)
        }
        if let username = config.object(forKey: "user") as? String {
            self.username = username
        }
        if let password = config.object(forKey: "pass") as? String {
            self.password = password
        }
        self.unsentThresholdMs = Settings.sharedInstance.unsentDataThresholdMs
       }

    private func authMode(authStr: String) -> ConnectionAuthMode {
        let modesMap: [String:ConnectionAuthMode] = [
            "lime": .llnw,
            "limelignt": .llnw,
            "peri": .periscope,
            "periscope": .periscope,
            "rtmp": .rtmp,
            "adobe": .rtmp,
            "aka": .akamai,
            "akamai": .akamai
        ]
        let authMode: ConnectionAuthMode
        if let mode = modesMap[authStr] {
            authMode = mode
        } else {
            authMode = .default
        }
        return authMode

    }
}

extension SrtConfig {

    
    func setup(from config: NSDictionary) {
        if let urlStr = config.object(forKey: "url") as? String,
           let url = URL(string: urlStr) {
            self.host = url.host
            self.port = Int32(url.port ?? 0)
        } else {
            if let host = config.object(forKey: "host") as? String {
                self.host = host
            }
            if let port = config.object(forKey: "port") as? Int32,
               port > 0 && port < Int16.max {
                self.port = port
            }
        }
        if let mode = config.object(forKey: "mode") as? String {
            self.mode = ConnectionMode(from: mode)
        }
        if let srtModeStr = config.object(forKey: "connectMode") as? String {
            self.connectMode = srtMode(from: srtModeStr)
        }
        if let pass = config.object(forKey: "passphrase") as? String {
            self.passphrase = pass
        }
        if let keylen = config.object(forKey: "pbkeylen") as? Int32 {
            self.pbkeylen = keylen
        }
        if let latency = config.object(forKey: "latency") as? Int32 {
            self.latency = latency
        }
        if let maxbw = config.object(forKey: "maxbw") as? Int32 {
            self.maxbw = maxbw
        }
        if let streamid = config.object(forKey: "streamid") as? String {
            self.streamid = streamid
        }
    }

    private func srtMode(from str: String) -> SrtConnectMode {
        let modesMap: [String:SrtConnectMode] = [
            "c": .caller,
            "caller": .caller,
            "l": .listen,
            "listen": .listen,
            "r": .rendezvous,
            "rendezvous": .rendezvous
        ]
        if let mode = modesMap[str] {
            return mode
        } else {
            return .caller
        }

    }
}
