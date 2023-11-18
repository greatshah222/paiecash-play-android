import React from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import SystemNavigationBar from "react-native-system-navigation-bar";

import Streamer from "../components/Larix/Streamer";
import { connections } from "../components/Larix/Connections";
import { settings } from "../components/Larix/Settings";
import { LarixUtils } from "../components/Larix/LarixUtils.js";
import { CameraInfo } from "../components/Larix/CameraInfo.js";
import Icon from "../components/common/Icon.js";
import { SETTINGS } from "../constants/routeNames.js";
import colors from "../assets/themes/colors";
import ScoreboardScreen from "../components/Scoreboard/ScoreboardScreen";

const ScoreboardScreenMemoized = React.memo(ScoreboardScreen);

class MainScreen extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			isStreaming: false,
			isWriting: false,
			captureActive: false,
			mute: false,
			isStreamingState: false,
			bitratesDelivered: 0,
		};

		settings.loadConfig().then(() => {
			let state = this.getConfigState();
			this.setState(state);
			console.log("loaded config");
		});
		this.streamer = React.createRef();

		settings.onConfigChange = () => {
			console.log("onConfigChange MainScreen");

			let state = this.getConfigState();
			this.setState(state);
			let streamer = this.streamer?.current;
			if (streamer == null || streamer.state.authorized !== true) {
				console.log("No streamer");
				return;
			}
		};

		props.navigation.addListener("focus", (ev) => {
			console.log("Entering main screen");
			SystemNavigationBar.fullScreen(true);

			let streamer = this.streamer?.current;
			streamer?.startCapture();
		});

		props.navigation.addListener("blur", (ev) => {
			SystemNavigationBar.fullScreen(false);

			let streamer = this.streamer?.current;
			if (streamer == null) {
				return;
			}
			this.setState({
				isStreaming: false,
				isWriting: false,
				captureActive: false,
				statistics: undefined,
				statusMessage: undefined,
			});
			console.log("Leaving main screen");
			streamer?.stopCapture();
		});
	}

	takeSnapshot = async () => {
		let streamer = this.streamer?.current;
		if (streamer == null) {
			return;
		}

		streamer.takeSnapshot();
	};

	getConfigState = () => {
		const videoConfig = settings.getVideoConfig();
		const audioConfig = settings.getAudioConfig();
		const recordConfig = settings.getRecordConfig();
		const pos = videoConfig.cameraPos ?? "back";
		const cameraId =
			pos == "front" ? videoConfig.defaultFrontCamera : videoConfig.defaultBackCamera;
		console.log(`Selected ${pos} camera ${cameraId}`);
		const hasFlash = CameraInfo.getInstance()?.isTorchSupported(cameraId) ?? false;
		console.log(`hasFlash: ${hasFlash}`);

		return {
			videoConfig: videoConfig,
			audioConfig: audioConfig,
			recordConfig: recordConfig,
			cameraPos: pos,
			cameraId: cameraId ?? pos,
			hasFlash: hasFlash,
		};
	};
	changeStreaminState = (val) => {
		let STREAMING = Platform.OS === "ios" ? "streaaming" : "streaming";

		this.setState({
			isStreamingState: val === STREAMING ? true : false, // NOTE streaming is differnet in IOS and android
		});
	};

	startSetup = () => {
		const streamer = this.streamer.current;
		if (streamer == null) {
			return;
		}

		this.props.navigation.navigate(SETTINGS); //, {cameraInfo: cameraInfo})
	};

	backToMainPage = () => {
		this.props.navigation.goBack();
	};

	switchCamera = () => {
		const streamer = this.streamer.current;
		if (streamer == null) {
			return;
		}

		let pos = this.state.cameraPos;
		console.log(`current camera position: ${pos}`);
		camId =
			pos == "back"
				? this.state.videoConfig.defaultFrontCamera
				: this.state.videoConfig.defaultBackCamera;
		console.log(`Switching to cameraId: ${camId} from ${this.state.cameraId}`);
		this.setState({ cameraId: camId });
	};

	startStream = () => {
		console.log("neew biahsl");
		const streamer = this.streamer.current;
		if (streamer == null) {
			return;
		}

		if (this.state.isStreaming) {
			streamer.disconnectAll();
		} else {
			const configList = connections.getActiveConfig();
			streamer.connect(configList);
		}
	};

	toggleFlash = () => {
		const streamer = this.streamer.current;
		if (streamer == null) {
			return;
		}

		if (streamer == null) {
			return;
		}
		let cam = streamer.state.camera;
		//console.log("Resolution: " + streamer.props.videoResoution);
		console.log("Current camera:" + cam);
		if (cam == null || cam.startsWith("front")) {
			return;
		}

		var torchOn = streamer.state.torch ?? false;
		console.log("toggle flash: " + torchOn);
		torchOn = !torchOn;
		streamer.setState({ torch: torchOn });
	};

	toggleMute = () => {
		const streamer = this.streamer.current;
		if (streamer == null) {
			return;
		}
		var isMuted = this.state.mute ?? false;
		isMuted = !isMuted;
		this.setState({ mute: isMuted });
	};

	handleCaptureState = (isActive, message) => {
		console.log(`handleCaptureState: ${isActive}`);
		let state = {
			captureActive: isActive,
			statusMessage: message,
			isStreaming: false,
			isWriting: false,
			statistics: undefined,
			duration: undefined,
		};
		if (isActive) {
			const cameraId = this.state.cameraId;
			const hasFlash = CameraInfo.getInstance()?.isTorchSupported(cameraId) ?? false;
			console.log(`hasFlash: ${hasFlash}`);
			state.hasFlash = hasFlash;
		}
		this.setState(state);
	};

	handleStreamingChange = (isActive) => {
		console.log(`handleStreamingChange: ${isActive}`);

		console.log(updState?.duration, this.state.isStreaming);
		if (this.state.isStreaming == isActive) {
			//Already updated
			return;
		}
		let updState = { isStreaming: isActive, statistics: undefined };
		if (!isActive) {
			updState.isWriting = false;
			updState.duration = undefined;
		}
		if (this.state.isStreaming != true && isActive == true) {
			updState.startTime = new Date();
			updState.duration = "0:00:00";
		}
		this.setState(updState);
	};

	handleCameraChange = (cameraInfo) => {
		if (cameraInfo.error != null) {
			let camId = cameraInfo.id;
			const streamer = this.streamer.current;

			this.setState({ cameraId: camId });
			streamer?.setState({ camera: camId });
			return;
		}
		let pos = cameraInfo.lensFacing;
		let hasFlash = cameraInfo.isTorchSupported ?? false;
		console.log(`hasFlash: ${hasFlash}`);
		if (pos != null) {
			this.setState({ cameraPos: pos, hasFlash: hasFlash });
		}
	};

	updateStats = (stats) => {
		let startTime = this.state.startTime;
		let duration = "";
		// console.log("startTime", startTime);
		if (startTime != null) {
			let now = new Date();
			let delta = now.getTime() - startTime.getTime();
			duration = LarixUtils.timeMsToString(delta);
		}
		if (stats == "" && this.state.isWriting == true) {
			stats = "Writing to file only";
		}

		//let duration = (stats) => this.setState({statistics: stats, duration: duration})
		this.setState({ statistics: stats, duration: duration });
	};

	updateDeliveredBitrates = (stats) => {
		this.setState({
			bitratesDelivered: Math.floor(stats / 1000),
		});
	};

	handleFileOperation = async (info) => {};

	TextView = (props) => {
		if (props.text == null || props.text == "") {
			return null;
		}
		return (
			<View style={props.style}>
				<Text style={{ color: "#ffffff" }}>{props.text}</Text>
			</View>
		);
	};

	RecordIndicator = (props) => {
		if (this.state.isWriting != true) {
			return null;
		}
		return <View style={styles.redDot} />;
	};

	render() {
		if (this.state == null || this.state.videoConfig == null || this.state.audioConfig == null) {
			return null;
		}
		return (
			<View style={styles.container}>
				<Streamer
					style={{ flex: 1, width: "100%" }}
					videoConfig={this.state.videoConfig}
					audioConfig={this.state.audioConfig}
					recordConfig={this.state.recordConfig}
					cameraId={this.state.cameraId}
					mute={this.state.mute}
					setBroadcasting={this.handleStreamingChange}
					setCaptureState={this.handleCaptureState}
					setStats={this.updateStats}
					updateDeliveredBitrates={this.updateDeliveredBitrates}
					cameraChanged={this.handleCameraChange}
					fileOperation={this.handleFileOperation}
					ref={this.streamer}
					changeStreamingState={this.changeStreaminState}
				/>

				<ScoreboardScreenMemoized
					startStream={this.startStream}
					isStreaming={this.state.isStreaming}
					mute={this.state.mute}
					toggleMute={this.toggleMute}
					backToMainPage={this.backToMainPage}
					gotToSettingsPage={this.startSetup}
					isStreamingState={this.state.isStreamingState}
				/>

				<View style={styles.statContainer}>
					<Icon
						type={"material"}
						// GREATER THAN 600 kbps is good
						name={this.state.bitratesDelivered >= 600 ? "signal-wifi-4-bar" : "signal-wifi-off"}
						size={30}
						color={colors.white}
					/>

					{this.state.isStreaming && this.state.isStreamingState && (
						<Text style={styles.statText}>{this.state.duration}</Text>
					)}
				</View>
				<View style={styles.statContainer2}>
					<Icon
						type={"ionicon"}
						name="radio"
						size={30}
						color={
							this.state.isStreaming && this.state.isStreamingState ? colors.green : colors.danger
						}
					/>
					{this.state.isStreaming && this.state.isStreamingState && (
						<Text style={styles.statText}>{this.state.statistics}</Text>
					)}
				</View>
			</View>
		);
	}
}

const styles = StyleSheet.create({
	statContainer: {
		padding: 10,
		top: 0,
		position: "absolute",
		left: 0,
		justifyContent: "center",
		alignItems: "center",

		// minWidth: 100,
		maxWidth: 100,
		height: 70,
	},
	statContainer2: {
		padding: 10,
		top: 0,
		position: "absolute",
		right: 0,
		justifyContent: "center",
		alignItems: "center",
		height: 70,
	},
	statText: {
		backgroundColor: "hsla(0, 0%, 20%, 0.9)",
		marginVertical: 2.5,
		paddingHorizontal: 5,
		borderRadius: 5,
		color: colors.white,
	},
	container: {
		flex: 1,
		backgroundColor: "#fff",
		alignItems: "center",
		justifyContent: "center",
	},
	leftControls: {
		position: "absolute",
		left: "5%",
		flexDirection: "column",
		justifyContent: "space-between",
	},
	rightControls: {
		position: "absolute",
		right: "2%",
		flexDirection: "column",
		justifyContent: "space-between",
	},
	status: {
		position: "absolute",
		top: "10%",
		left: "10%",
		backgroundColor: "hsla(0, 0%, 20%, 0.5)",
		padding: 10,
	},
	stats: {
		position: "absolute",
		bottom: "10%",
		left: "10%",
		backgroundColor: "hsla(0, 0%, 20%, 0.5)",
		padding: 10,
		borderRadius: 10,
	},
	duration: {
		position: "absolute",
		flexDirection: "row",
		top: "15%",
		left: "5%",
	},
	durationText: {
		backgroundColor: "hsla(0, 0%, 20%, 0.5)",
		padding: 5,
		borderRadius: 5,
	},
	roundButton: {
		borderRadius: 40,
		width: 20,
		height: 40,
		backgroundColor: "hsla(0, 0%, 30%, 0.3)",
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
		margin: 10,
	},
	normalStyle: {},
	disabledStyle: {
		opacity: 0.5,
		backgroundColor: "hsla(0, 0%, 10%, 0.3)",
	},

	bigButton: {
		marginTop: 20,
		borderRadius: 50,
		height: 80,
		width: 80,
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
	},

	redDot: {
		width: 24,
		height: 24,
		borderRadius: 12,
		backgroundColor: "red",
	},
});

export default MainScreen;
