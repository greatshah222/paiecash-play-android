import Foundation
import LarixCore
import LarixStream

extension ConnectionState {
    var code: String {
        switch self {
        case .disconnected:
            return "disconnected"
        case .initialized:
            return "initialized"
        case .connected:
            return "connected"
        case .setup:
            return "setup"
        case .record:
            return "streaaming"
        @unknown default:
            return "unknown"
        }

    }
}

extension ConnectionStatus {
    var code: String {
        switch self {
        case .success:
            return "success"
        case .connectionFail:
            return "connectionFail"
        case .authFail:
            return "authFail"
        case .unknownFail:
            return "fail"
        case .timeout:
            return "timeout"
        @unknown default:
            return "unknown"

        }
    }
}

extension RecordState {
    var code: String {
        switch self {
        case .initialized:
            return "init"
        case .started:
            return "started"
        case .stopped, .stalled:
            return "success"
        case .failed:
            return "failed"
        }
    }
}

extension CaptureStatus {
    var code: String {
        switch self {
        case .success:
            return "success"
        case .errorVideoEncoding:
            return "errorVideoEncode"
        case .errorCaptureSession:
            return "errorCaptureSession"
        case .errorCameraInUse:
            return "errorCamera"
        case .errorMicInUse:
            return "errorMic"
        case .errorCameraUnavailable:
            return "errorCameraUnavaiable"
        case .errorSessionWasInterrupted:
            return "errorVideoInterrupted"
        case .errorCoreImage:
            return "errorCoreImage"
        case .stepInitial:
            return "setupInit"
        case .stepAudioSession:
            return "setupAudio"
        case .stepFilters:
            return "setupFilters"
        case .stepVideoEncoding:
            return "setupVideoEncoder"
        case .stepVideoIn:
            return "seupVideoIn"
        case .stepVideoOut:
            return "seupVideoOut"
        case .stepAudio:
            return "setupAudio"
        case .stepStillImage:
            return "setupPhoto"
        case .stepSessionStart:
            return "setupDone"
        }
    }
}

extension CaptureState {
    var code: String {
        switch self {
        case .setup:
            return "setup"
        case .started:
            return "started"
        case .stopped:
            return "stopped"
        case .failed:
            return "failed"
        case .canRestart:
            return "canRestart"

        }
    }
}

