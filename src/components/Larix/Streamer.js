import PropTypes from "prop-types";
import React from "react";
import {
	NativeModules,
	NativeEventEmitter,
	requireNativeComponent,
	View,
	Text,
} from "react-native";
import Toast from "react-native-toast-message";
import { activateKeepAwake, deactivateKeepAwake } from "expo-keep-awake";

import { LarixUtils } from "./LarixUtils";
import { CameraInfo } from "./CameraInfo";

var StreamerView = requireNativeComponent("StreamerView", StreamerView);
const { LarixStreamer } = NativeModules;

const CAMERA_API_VERSION = 2; //For Android

const streamListeners = [
	"onConnectionStateChanged",
	"onCaptureStateChanged",
	"onCameraChanged",
	"onStreamerStats",
	"onFileOperation",
];

export default class Streamer extends React.Component {
	static defaultProps = {
		retryTimeout: 5000,
	};

	captureErrorCodes = {
		errorAudio: "Audio capture failure", //Android
		errorAudioEncode: "Audio encoding failure", //Android
		errorVideo: "Video capture failure", //Android
		errorVideoEncode: "Can't start video encoding", //Android + iOS
		errorCaptureSession: "Capture runtime error. Try to restart", //iOS
		errorCoreImage: "Video frame processing failed", //iOS
		errorCameraInUse: "Camera in use by another application. Try to restart", //iOS
		errorMicInUse: "Microphone in use by another application", //iOS
		errorCameraUnavailable: "Camera unavailable", //iOS
		errorSessionWasInterrupted: "Capture session was interrupted. Try to restart", //iOS
		errorMediaServicesWereReset: "Media services were reset. Try to restart", //iOS
		errorAudioSessionWasInterrupted: "Audio session was interrupted. Try to restart", //iOS
	};

	constructor(props) {
		super(props);

		this.state = {
			authorized: false,
			statsUpdateInterval: 0.0,
			broadcasting: false,
			torch: false,
			connections: [],
			connectionState: {},
			cameraInfo: [],
		};

		const onGranted = (result) => {
			console.log("Permissions granted: " + result);
			if (result != 0) {
				console.log("calling getCameraInfo ");
				LarixStreamer.getCameraInfo(CAMERA_API_VERSION, (info) => {
					console.log(info);
					this.cameraInfo = new CameraInfo(info.cameraInfo);
				});
				activateKeepAwake("streamer");
				this.setState({
					authorized: true,
					camera: this.props.cameraId,
				});
			}
		};

		const onFailed = (error) => {
			console.log(`Permssions failed: ${error}`);
			if (error.code == "cam") {
				Toast.show({
					type: "error",
					autoHide: false,
					text1: "Camera is disabled",
					text2: "Allow the app to access the camera in your device's settings.",
				});
			} else if (error.code == "mic") {
				Toast.show({
					type: "error",
					autoHide: false,
					text1: "Microphone is disabled",
					text2: "Allow the app to access the microphone in your device's settings.",
				});
			}
		};
		LarixStreamer?.requestPermissions().then(onGranted, onFailed);
	}

	addLarixListeners = () => {
		if (this.listeners != null) {
			return;
		}
		const eventEmitter = this.eventEmitter ?? new NativeEventEmitter(LarixStreamer);
		let listeners = [];
		streamListeners.forEach((name) => {
			if (typeof this[name] == "function") {
				listeners.push(eventEmitter.addListener(name, this[name]));
			} else {
				console.log(`Can't get handler for ${name}`);
			}
		});
		this.eventEmitter = eventEmitter;
		this.listeners = listeners;
	};

	removeLarixListeners = () => {
		const eventEmitter = this.eventEmitter;
		const listeners = this.listeners;
		if (eventEmitter != null && listeners != null) {
			listeners.forEach((listener) => listener.remove());
			this.listeners = undefined;
		}
	};

	componentDidMount() {
		console.log("componentDidMount");
		this.addLarixListeners();
	}
	componentWillUnmount() {
		console.log("componentWillUnmount");
		this.stopCapture();
		this.removeLarixListeners();
	}

	render() {
		return this.state.authorized ? (
			<StreamerView
				style={{ flex: 1, width: "100%", backgroundColor: "black" }}
				autoStart={true}
				cameraId={this.props.cameraId}
				previewScale="fit"
				statsUpdateInterval={this.state.statsUpdateInterval}
				videoConfig={this.props.videoConfig}
				audioConfig={this.props.audioConfig}
				torch={this.state.torch}
				mute={this.props.mute}
			></StreamerView>
		) : (
			<View style={{ flex: 1, width: "100%", backgroundColor: "black" }}>
				<Text
					style={{
						color: "#fff",
						fontWeight: "bold",
						textAlign: "center",
					}}
				>
					No permissions
				</Text>
			</View>
		);
	}

	startCapture = () => {
		console.log(`StartCapture camera=${this.props.cameraId}`);
		LarixStreamer.startCapture();
		activateKeepAwake("streamer");
	};

	stopCapture = () => {
		this.disconnectAll();
		LarixStreamer.stopCapture();
		deactivateKeepAwake("streamer");
	};

	connectTo = (url) => {
		console.log(`Connecting to ${url}`);
		this.setState({
			configList: [{ name: "Connection", url: url }],
			statsUpdateInterval: 1.0,
			broadcasting: true,
		});
		if (this.props.setBroadcasting != null) {
			this.props.setBroadcasting(true);
		}
		LarixStreamer.connectTo(url, this.onConnect);
	};

	connect = (configList) => {
		let recordOn = this.props.recordConfig?.active ?? false;
		if (configList.length > 0 || recordOn) {
			console.log("Creating connections");

			if (configList.length > 0) {
				LarixStreamer.connect(configList, this.onConnect);
			}
			this.setState({
				configList: configList,
				statsUpdateInterval: 1.0,
				broadcasting: true,
			});
			if (this.props.setBroadcasting != null) {
				this.props.setBroadcasting(true);
			}
			if (recordOn && !this.recordActive) {
				let split = this.props.recordConfig?.segmentDuration ?? 0;
				this.recordActive = true;
				let filename = this.props.recordConfig.getVideoFilename?.();
				console.log(`Record filename: ${filename}`);
				LarixStreamer.startRecord(filename);
				if (split > 0) {
					console.log(`Set split timer to ${split} seconds`);
					this.splitTimer = setInterval(this.splitRecord, split * 1000);
				}
			}
		} else {
			Toast.show({
				type: "error",
				text1: "You have no active connections.",
				text2: "Please go to settings and setup connection.",
			});
		}
	};

	splitRecord = () => {
		let filename = this.props.recordConfig.getVideoFilename?.();
		console.log(`Split record filename: ${filename}`);
		LarixStreamer.startRecord(filename);
	};

	disconnectAll = () => {
		this.clearStreamingState();
		if (this.props.setBroadcasting != null) {
			this.props.setBroadcasting(false);
		}
		LarixStreamer.disconnectAll();
		if (this.recordActive == true) {
			LarixStreamer.stopRecord();
			this.recordActive = false;
		}
	};

	takeSnapshot = () => {
		let filename = this.props.recordConfig.getPhotoFilename?.();
		console.log(`Photo filename: ${filename}`);

		LarixStreamer.takeSnapshot(filename);
	};

	clearStreamingState = () => {
		if (this.state.retryTimer != null) {
			clearInterval(this.state.retryTimer);
		}
		if (this.splitTimer != null) {
			clearInterval(this.splitTimer);
			delete this.splitTimer;
		}

		this.setState({
			broadcasting: false,
			statsUpdateInterval: 0.0,
			statistics: undefined,
			retryList: undefined,
			retryTimer: undefined,
		});
	};

	componentDidUpdate(oldProps) {
		if (oldProps.camera != this.props.camera) {
			console.log("Camera value changed");
		}
	}

	onCaptureStateChanged = (event) => {
		console.log("onCaptureStateChanged");
		console.log(event);

		let state = event.state;
		let status = "";
		let statusCode = event.status;
		if (statusCode != null) {
			status = this.captureErrorCodes[statusCode] ?? "";
		}
		if (this.props.setCaptureState != null) {
			if (state == "started") {
				this.props.setCaptureState(true, "");
			} else if (state == "failed" || state == "stopped") {
				if (this.state.broadcasting == true) {
					this.clearStreamingState();
				}
				this.props.setCaptureState(false, status);
			}
		} else {
			console.log("No setCaptureState assigned");
		}
	};

	onConnectionStateChanged = (event) => {
		console.log("onConnectionStateChanged", event);
		console.log(event);

		let broadcasting = this.state.broadcasting ?? false;
		let connectionState = this.state.connectionState ?? {};
		console.log(connectionState);
		let connId = event.connectionId;
		let state = event.state;

		this.props.changeStreamingState(state);
		let status = event.status;

		let name = connectionState[connId]?.name ?? "";
		var errorMessage = null;
		var retry = false;
		const retryTimeout = this.props.retryTimeout;
		let configList = this.state.connectionConfig;
		let retryList = this.state.retryList ?? [];

		if (state == "disconnected" && broadcasting) {
			switch (status) {
				case "connectionFail":
					errorMessage = `${name}: Could not connect to server. Please check stream URL and network connection.`;
					retry = true;
					break;
				case "timeout":
					errorMessage = `${name}: Connection timeout.`;
					retry = true;
					break;
				case "unknownFail":
					let info = event.info;
					if (info != null && info !== {}) {
						console.log("info,event", info, event);
						errorMessage = `${name}: Error: Please try again`;
					} else {
						errorMessage = `${name}: Unknown connection error.`;
					}
					break;
				case "authFail":
					//TODO: check authmod
					errorMessage = `${name}: Authentication error. Please check stream credentials.`;
			}
			if (retry) {
				console.log("retrying");
				let config = configList[connId];
				retryList.push(config);
				console.log(retryList);
				delete configList[connId];
				let timer = this.state.retryTimer;
				if (timer != null) {
					clearInterval(timer);
				}
				timer = setInterval(this.retry, retryTimeout);
				this.setState({
					retryTimer: timer,
					retryList: retryList,
					configList: configList,
				});
			}
		}
		if (errorMessage != null) {
			if (retry) {
				let retrySec = retryTimeout / 1000;
				errorMessage += ` Retrying in ${retrySec} seconds.`;
			}
			Toast.show({ type: "error", text2: errorMessage });
		}
		if (state == "disconnected") {
			delete connectionState[connId];
		} else {
			connectionState[connId].state = state;
		}

		const activeConns = Object.keys(connectionState);

		if (activeConns.length == 0 && retryList.length == 0 && this.recordActive != true) {
			console.log("No active connections");
			this.disconnectAll();
		}
		this.setState({ connectionState: connectionState });
	};

	retry = () => {
		let config = this.state.retryList ?? [];
		this.setState({
			retryList: undefined,
			retryTimer: undefined,
		});
		if (config.length > 0) {
			this.connect(config);
		}
	};

	onStreamerStats = (data) => {
		let statsStr = "";
		let bitratesDeliverd = 0;
		const connectionState = this.state.connectionState ?? {};
		Object.entries(data).forEach((entry) => {
			const [connId, stats] = entry;
			if (typeof stats == "object") {
				const name = connectionState[connId]?.name ?? "";

				const traffic = stats.bytesDelivered;
				const bitrate = stats.bitrate;
				if (traffic == null || bitrate == null) return;
				const bitrateStr = LarixUtils.bandwidthToString(bitrate);
				const trafficStr = LarixUtils.trafficToString(traffic);
				if (statsStr != "") statsStr += "\n";
				// statsStr += `${name} streaming started: ${bitrateStr}, ${trafficStr}`;
				statsStr += `${bitrateStr}`;
				bitratesDeliverd = stats.bitrate;
			}
		});

		this.props.updateDeliveredBitrates?.(bitratesDeliverd);
		this.props.setStats?.(statsStr);
	};

	onCameraChanged = (info) => {
		console.log("camera changed");
		console.log(info);

		if (info.error != null) {
			let errorMsg = "";
			if (info.error == "changeCameraFailed") {
				errorMsg =
					"The selected video size or frame rate is not supported by the destination camera";
			} else if (info.error == "frameRateNotSupported") {
				errorMsg = "The selected frame rate is not supported by this camera";
			}

			Toast.show({
				type: "error",
				text1: "Failed to change camera",
				text2: errorMsg,
			});
		} else {
			this.setState({ torch: false });
		}
		const fn = this.props.cameraChanged;
		if (fn != null) {
			fn(info);
		}
	};

	onConnect = (connId) => {
		let idList = connId;
		if (!Array.isArray(connId)) {
			idList = [connId];
		}
		let connectionState = this.state.connectionState ?? {};
		let connectionConfig = this.state.connectionConfig ?? {};
		idList.forEach((id, idx) => {
			//console.log(`Created connection with id ${id}`)
			let config = this.state.configList[idx];
			connectionConfig[id] = config;
			//console.log(config)
			let state = {
				state: "connecting",
				name: config?.name ?? "",
				url: config?.url ?? "",
			};
			connectionState[id] = state;
		});
		//console.log(connectionState)

		this.setState({
			configList: undefined,
			connectionConfig: connectionConfig,
			connectionState: connectionState,
		});
	};

	onFileOperation = (event) => {
		const info = event;
		console.log(info);
		const fn = this.props.fileOperation;
		if (fn != null) {
			fn(info);
		}
	};
}
