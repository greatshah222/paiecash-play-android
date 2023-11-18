import AVFoundation
import AudioUnit
import VideoToolbox

import LarixStream

class Settings {
    
    static let sharedInstance = Settings() // Singleton pattern in Swift
    private init() {
        // This prevents others from using the default '()' initializer for this class.
        
    }
    
    internal let camera_location_back = "back"
    internal let baseline = "baseline"
    internal let main = "main"
    internal let high = "high"
    internal let main10 = "main10"
    internal let camera_type_default = "Auto"

    internal let video_bitrate_auto = 0
    
    /* https://help.twitch.tv/customer/portal/articles/1262922-open-broadcaster-software
     ​Recommended bitrate for 1080p 3000-3500
     Recommended bitrate for 720p  1800-2500
     Recommended bitrate for 480p  900-1200
     Recommended bitrate for 360p  600-800
     Recommended bitrate for 240p  Up to 500 */
    
    private let VideoBitrates: [Int32:Int] = [2160:4500, 1080:3000, 720:2000, 540:1500, 480:1000, 360:700, 288:500, 144:300]
    
    var postprocess: Bool = true
    var liveRotation: Bool = true
    var useMetal: Bool = false
    var resolution: CMVideoDimensions = CMVideoDimensions(width: 1280, height: 720)
    var portrait: Bool = false
    var cameraId: String = "back"
    var fps: Double = 30.0
    var videoBitrate: Int = 0
    var videoCodecType: CMVideoCodecType = kCMVideoCodecType_H264 
    var keyFrameIntervalDuration: Double = 2.0
    var displayLayerGravity: AVLayerVideoGravity = .resizeAspectFill
    
    var channelCount: Int = 1
    var sampleRate: Double = 0.0
    var audioBitrate: Int = 0

    
    func recommendedBitrate(for resolution: CMVideoDimensions) -> Int {
        var bitrate = 3000
        let height = resolution.height
        guard let res = VideoBitrates.keys.sorted().first(where: { $0 >= height }) else {
            return bitrate
        }
        
        bitrate = VideoBitrates[res] ?? bitrate
        // HEVC promises a 50% storage reduction as its algorithm uses efficient coding by encoding video at the lowest possible bit rate while maintaining a high image quality level.
        if videoCodecType == kCMVideoCodecType_HEVC {
            bitrate /= 2
        }
        if fps > 49.0 {
            // Set bitrate to 1.6x for 50+ FPS modes
            bitrate = bitrate * 16 / 10
        }
        return bitrate
    }
    
    var unsentDataThresholdMs: UInt64 {
        return 15_000
    }

    private func videoSize(camera: AVCaptureDevice?) -> CMVideoDimensions {
        let wantResolution = resolution
        var maxResolution = CMVideoDimensions(width: 192, height: 144)
        guard let camera = camera else {
            return resolution
        }
        let videoFormats = camera.formats.filter { format in

            let mediaType = CMFormatDescriptionGetMediaType(format.formatDescription)
            let fourCharCode = CMFormatDescriptionGetMediaSubType(format.formatDescription)
            return mediaType == kCMMediaType_Video && fourCharCode != kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange
        }
        for format in videoFormats {
            let camResolution = CMVideoFormatDescriptionGetDimensions(format.formatDescription)
            if camResolution.height == wantResolution.height && camResolution.width == wantResolution.width {
                return camResolution
            }
            // if resolution is not supported (ex: iPhone 4s front camera can't produce 1080p), save max possible resolution
            if camResolution.height >= maxResolution.height && camResolution.height <= 1080 {
                maxResolution = camResolution
            }
        }
        return maxResolution
    }

    
    private var profileLevel: CFString {
        if videoCodecType == kCMVideoCodecType_HEVC {
//            let hevc = UserDefaults.standard.string(forKey: SK.hevc_profile_key) ?? main
//            switch hevc {
//            case main10:
//                return kVTProfileLevel_HEVC_Main10_AutoLevel
//            default:
                return kVTProfileLevel_HEVC_Main_AutoLevel
//            }
        }
//        let avc = UserDefaults.standard.string(forKey: SK.avc_profile_key) ?? baseline
//        switch avc {
//        case high:
//            return kVTProfileLevel_H264_High_AutoLevel
//        case main:
//            return kVTProfileLevel_H264_Main_AutoLevel
//        default:
            return kVTProfileLevel_H264_Baseline_AutoLevel
//        }
    }
    
    var selectedCamera: AVCaptureDevice? {
        return getCameraById(cameraId)
    }
    
    func parseVideoGravity(_ value: String) {
        if value == "fit" {
            displayLayerGravity = .resizeAspect
        } else if value == "fill" {
            displayLayerGravity = .resizeAspectFill
        } else if value == "stretch" {
            displayLayerGravity = .resize
        }
 
    }
    
    func parseVideoConfig(config: NSDictionary) {
        if let res = config.object(forKey: "res") as? String,
           let dimensions = parseResolution(res)
        {
            self.resolution = dimensions
        }
        if let fps = config.object(forKey: "fps") as? NSString {
            var fpsStr = fps as String
            if let sep = fpsStr.lastIndex(of: "-") {
                let r = fpsStr.startIndex...sep
                fpsStr.removeSubrange(r)
            }
            self.fps = Double(fpsStr) ?? 30
        }
        if let bitrate = config.object(forKey: "bitrate") as? NSNumber {
            self.videoBitrate = bitrate.intValue
        }
        if let format = config.object(forKey: "format") as? NSString {
            if format == "avc" {
                videoCodecType = kCMVideoCodecType_H264
            } else if format == "hevc" {
                videoCodecType = kCMVideoCodecType_HEVC
            }
        }
        if let keyframe = config.object(forKey: "keyframe") as? NSNumber {
            let keyframeF = keyframe.doubleValue
            if keyframeF > 0 {
                self.keyFrameIntervalDuration = keyframeF
            }
        }
        if let rotation = config.object(forKey: "liveRotation") as? NSString {
            if rotation == "off" {
                postprocess = false
                liveRotation = false
            } else if rotation == "follow" || rotation == "on" {
                postprocess = true
                liveRotation = true
            } else if rotation == "lock" {
                postprocess = true
                liveRotation = false
            }
        }
        if let orientation = config.object(forKey: "orientation") as? NSString {
            portrait = orientation == "portrait"
        }
    }
    
    private func parseResolution(_ res: String) -> CMVideoDimensions? {
        let separator = CharacterSet.init(charactersIn: ":*x")
        let parts = res.components(separatedBy: separator)
        if parts.count != 2 {
            return nil
        }
        let wStr = parts[0]
        let hStr = parts[1]
        guard let w = Int32(wStr), let h = Int32(hStr) else {
            return nil
        }
        return CMVideoDimensions(width: w, height: h)
    }
    
    var videoConfig: VideoConfig {
        let cam = selectedCamera
        let size = videoSize(camera: cam)
        let codecType = videoCodecType
        var bitrate = videoBitrate
        if bitrate == video_bitrate_auto {
           bitrate = recommendedBitrate(for: size)
        }
        let processingMode: VideoConfig.ProcessingMode = useMetal ? .metal : .coreImage
        let config = VideoConfig(
            cameraID: cam?.uniqueID ?? "",
            videoSize: size,
            fps: fps,
            keyFrameIntervalDuration: keyFrameIntervalDuration,
            bitrate: bitrate * 1000,
            portrait: portrait,
            type: codecType,
            profileLevel: profileLevel,
            processingMode: processingMode)
        
        return config
    }
    
    func parseAudioConfig(config: NSDictionary) {
        if let bitrate = config.object(forKey: "bitrate") as? NSNumber {
            self.audioBitrate = bitrate.intValue
        }
        if let channels = config.object(forKey: "channels") as? NSNumber {
            if channels.intValue > 0 {
                self.channelCount = channels.intValue
            }
        }
        if let sampleRate = config.object(forKey: "samples") as? NSNumber {
            self.sampleRate = sampleRate.doubleValue
        }
    }
    
    var audioConfig: AudioConfig {
        let config = AudioConfig(
            sampleRate: sampleRate,
            channelCount: channelCount,
            bitrate: audioBitrate * 1000)
        return config
    }

    private func isHEVCEncodingSupported(size: CMVideoDimensions) -> Bool {
        let encoderSpecDict : [String : Any] =
            [kVTCompressionPropertyKey_ProfileLevel as String : kVTProfileLevel_HEVC_Main_AutoLevel,
             kVTCompressionPropertyKey_RealTime as String : true]
        
        let status = VTCopySupportedPropertyDictionaryForEncoder(width: size.width, height: size.height,
                                                                 codecType: kCMVideoCodecType_HEVC,
                                                                 encoderSpecification: encoderSpecDict as CFDictionary,
                                                                 encoderIDOut: nil, supportedPropertiesOut: nil)
        if status == kVTCouldNotFindVideoEncoderErr {
            return false
        }
        if status != noErr {
            return false
        }
        return true
    }

    func getCameraById(_ s: String) -> AVCaptureDevice? {
        if let camByUniqueId = AVCaptureDevice(uniqueID: s) {
            return camByUniqueId
        }
        if s.rangeOfCharacter(from: CharacterSet.decimalDigits) == s.startIndex..<s.endIndex {
            let deviceId = "com.apple.avfoundation.avcapturedevice.built-in_video:" + s
            if let camById = AVCaptureDevice(uniqueID: deviceId) {
                return camById
            }
        }
        let h = s.firstIndex(of: "#")
        var posStr: Substring?
        var typeStr: Substring?
        if let pos = h {
            posStr = s.prefix(upTo: pos)
            typeStr = s.suffix(from: s.index(pos, offsetBy: 1))
        } else {
            posStr = Substring(s)
        }
        let pos: AVCaptureDevice.Position
        switch posStr {
        case "back", "b", "0":
            pos = .back
        case "front", "f", "1":
            pos = .front
        default:
            pos = .unspecified
        }
        var type: AVCaptureDevice.DeviceType = .builtInWideAngleCamera
        if let typeStr = typeStr {
            if #available(iOS 13.0, *) {
                switch typeStr {
                case "wide":
                    type = .builtInWideAngleCamera
                case "tele":
                    type = .builtInTelephotoCamera
                case "ultrawide":
                    type = .builtInUltraWideCamera
                case "dual":
                    type = .builtInDualWideCamera
                case "triple":
                    type = .builtInTripleCamera
                default:
                    type = .builtInWideAngleCamera
                }
            } else {
                switch typeStr {
                case "wide":
                    type = .builtInWideAngleCamera
                case "tele":
                    type = .builtInTelephotoCamera
                case "dual":
                    type = .builtInDualCamera
                default:
                    type = .builtInWideAngleCamera
                }
            }

        }
        var cameara = AVCaptureDevice.default(type, for: .video, position: pos)
        if cameara == nil {
            cameara = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: pos)
        }
        if cameara == nil {
            cameara = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .unspecified)
        }
        
        return cameara

    }

}
