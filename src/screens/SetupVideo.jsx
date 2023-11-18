import React from "react";
import { StyleSheet, View, Switch, Text, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import ConfigDropDown from "../components/Larix/ConfigDropdown";
import { settings } from "../components/Larix/Settings";
import { CameraInfo } from "../components/Larix/CameraInfo";
import { withTranslation } from "react-i18next";

class VideoSettingsScreen extends React.Component {
	constructor(props) {
		super(props);

		this.cameraInfo = CameraInfo.getInstance();
		if (this.cameraInfo == null) {
			console.log("no CameraInfo");
			this.cameraInfo = new CameraInfo([]);
		}

		let videoConfig = settings.getVideoConfig();
		this.startCam = [
			{ label: this.props.t("setupVideoScreen.backSide"), value: "back" },
			{ label: this.props.t("setupVideoScreen.frontSide"), value: "front" },
		];

		let camId = this.getDefaultCam(videoConfig);
		this.defaultCamId = camId;
		this.backCam = this.cameraInfo.getBackCameraList() ?? [];
		this.frontCam = this.cameraInfo.getFrontCameraList() ?? [];
		// const res = this.cameraInfo.getResolutions(camId);
		console.log("res", res);
		// https://support.google.com/youtube/answer/6375112?hl=en&co=GENIE.Platform%3DDesktop
		const res = ["1920x1080", "1280x720", "854x480"];
		const resolutionList = this.arrayToOptions(res);
		console.log("resolutionList", resolutionList, res, camId);

		const fps = this.cameraInfo.getFps(camId);
		const fpsList = this.arrayToOptions(fps);

		this.orientations = [
			{ label: this.props.t("setupVideoScreen.landscape"), value: "landscape" },
			{ label: this.props.t("setupVideoScreen.portait"), value: "portrait" },
		];
		this.liveRotationList = [
			{ label: this.props.t("setupVideoScreen.off"), value: "off" },
			{
				label: this.props.t("setupVideoScreen.followScreenRotation"),
				value: "follow",
			},
			{
				label: this.props.t("setupVideoScreen.lockWhileBroadcasting"),
				value: "lock",
			},
		];

		this.formats = [
			{ label: "H.264", value: "avc" },
			{ label: "HEVC", value: "hevc" },
		];

		this.state = {
			resolutionList: resolutionList,
			fpsList: fpsList,
			selectedCam: this.defaultCamId,
			resLabel: this.props.t("setupVideoScreen.resolution"),
			bitrateStr: "" + videoConfig.bitrate,
			videoConfig: videoConfig,
		};
	}

	arrayToOptions = (data, prefix) => {
		return data.map((elem) => {
			return {
				label: prefix == null ? elem : prefix + elem,
				value: elem,
			};
		});
	};

	onChangeField = (field, newValue) => {
		let upd = {};
		upd[field] = newValue;
		let config = {};
		Object.assign(config, this.state.videoConfig, upd);
		let val = config[field];
		console.log(`OnChange ${field} ${val}`);
		//this.videoConfig = config
		if (field == "bitrate") {
			this.setState({ bitrateStr: `${newValue}`, videoConfig: config });
		} else {
			this.setState({ videoConfig: config });
		}
		this.onChange(field, upd);
	};

	onChange = (field, newConfig) => {
		let config = {};
		Object.assign(config, this.state.videoConfig);
		config[field] = newConfig[field];
		if (field == "cameraPos" || field == "defaultBackCamera" || field == "defaultFrontCamera") {
			let camId = this.getDefaultCam(newConfig);
			if (camId != this.defaultCamId) {
				console.log(`updating lists for cam ${camId}`);
				// const resolutions = this.cameraInfo.getResolutions(camId);
				console.log("resolutions111", resolutions);
				const resolutions = ["1920x1080", "1280x720", "854x480"];
				const resolutionList = this.arrayToOptions(resolutions);
				const fps = this.cameraInfo.getFps(camId);
				const fpsList = this.arrayToOptions(fps);

				let currentRes = config.res;
				let newRes = this.findNearestRes(currentRes, resolutions);
				console.log("newRes", newRes);
				if (newRes != currentRes) {
					config.res = newRes;
				}

				let currentFps = config.fps;
				let newFps = this.findNearestFps(currentFps, fps);
				if (newFps != currentFps) {
					config.fps = newFps;
				}

				this.setState({
					videoConfig: config,
					resolutionList: resolutionList,
					fpsList: fpsList,
					selectedCam: camId,
				});
				this.defaultCamId = camId;
			}
		} else {
			this.setState({ videoConfig: config });
			// we also need to change bitrate if field is res->resolution changes which means bitrate changes automatically
		}
		if (field === "res") {
			// we will change bitrate
			console.log("this.state.videoConfig", config);
			console.log(newConfig, 11111, newConfig.res === "1280x720");

			let newBitrate;

			if (newConfig.res === "1920x1080") {
				newBitrate = 6000;
			} else if (newConfig.res === "1280x720") {
				newBitrate = 3500;
			} else {
				newBitrate = 1800;
			}
			let configOld = { ...config, ["bitrate"]: newBitrate };
			this.setState({ videoConfig: configOld });
			settings.saveVideoConfig(configOld);
		} else {
			settings.saveVideoConfig(config);
		}
	};

	findNearestRes = (targetRes, resolutions) => {
		let foundRes = "320x240";
		let foundW = 320;
		let foundH = 240;
		let [targetW, targetH] = targetRes.split("x");
		let matching = resolutions.find((res) => {
			if (res == targetRes) {
				return true;
			}
			let [wStr, hStr] = res.split("x", 2);
			let w = parseInt(wStr);
			let h = parseInt(hStr);
			if (w <= targetW && h <= targetH && (w >= foundW || h >= foundH)) {
				foundRes = res;
				foundH = h;
				foundW = w;
			}
			return false;
		});
		return matching ?? foundRes;
	};

	findNearestFps = (taretFps, fpsOptions) => {
		let matching = fpsOptions.find((fps) => fps == taretFps);
		return matching ?? fpsOptions[fpsOptions.length - 1];
	};

	getDefaultCam = (config) => {
		let camId = "0";
		if (config.cameraPos == "front") {
			camId = config.defaultFrontCamera ?? this.cameraInfo.getDefaultFrontCamera();
		} else {
			camId = config.defaultBackCamera ?? this.cameraInfo.getDefaultBackCamera();
		}
		return camId ?? "0";
	};

	render() {
		return (
			<SafeAreaView edges={["top", "left", "bottom"]} style={styles.container}>
				<KeyboardAwareScrollView enableOnAndroid={true}>
					<ConfigDropDown
						config={this.state.videoConfig}
						onChange={this.onChange}
						label={this.props.t("setupVideoScreen.initialCamera")}
						items={this.startCam}
						field="cameraPos"
					/>
					<ConfigDropDown
						config={this.state.videoConfig}
						onChange={this.onChange}
						label={this.props.t("setupVideoScreen.backCamera")}
						items={this.backCam}
						field="defaultBackCamera"
					/>
					<ConfigDropDown
						config={this.state.videoConfig}
						onChange={this.onChange}
						label={this.props.t("setupVideoScreen.frontCamera")}
						items={this.frontCam}
						field="defaultFrontCamera"
					/>
					<ConfigDropDown
						config={this.state.videoConfig}
						value={this.state.videoConfig.res}
						onChange={this.onChange}
						label={this.state.resLabel}
						items={this.state.resolutionList}
						field="res"
						cam={this.state.selectedCam}
					/>
					{/* <ConfigDropDown
            config={this.state.videoConfig}
            value={this.state.videoConfig.fps}
            onChange={this.onChange}
            label='Frame rate'
            items={this.state.fpsList}
            field='fps'
            cam={this.state.selectedCam}
          /> */}
					<ConfigDropDown
						config={this.state.videoConfig}
						onChange={this.onChange}
						label="Orientation"
						items={this.orientations}
						field="orientation"
					/>
					<ConfigDropDown
						config={this.state.videoConfig}
						onChange={this.onChange}
						label={this.props.t("setupVideoScreen.liveRotation")}
						items={this.liveRotationList}
						field="liveRotation"
					/>
					{/* <Text>Bitrate (Kbps)</Text>
          <TextInput
            style={styles.textEdit}
            onChangeText={(newValue) =>
              this.onChangeField('bitrate', parseInt('0' + newValue))
            }
            placeholder='0'
            keyboardType={'number-pad'}
            value={this.state.bitrateStr}
          /> */}
					{/* <ConfigDropDown
            config={this.state.videoConfig}
            onChange={this.onChange}
            label='Format'
            items={this.formats}
            field='format'
          /> */}
				</KeyboardAwareScrollView>
			</SafeAreaView>
		);
	}
}

const styles = StyleSheet.create({
	container: {
		marginHorizontal: 10,
	},
	checkboxRow: {
		flexDirection: "row",
		padding: 10,
	},
	checkboxTitle: {
		flexBasis: "auto",
		flexGrow: 1,
	},
	checkboxItem: {
		marginLeft: 10,
	},

	textEdit: {
		margin: 4,
		marginBottom: 10,
		paddingTop: 6,
		paddingBottom: 6,
		paddingLeft: 4,
		borderWidth: 1,
		borderRadius: 4,
	},
});

export default withTranslation()(VideoSettingsScreen);
