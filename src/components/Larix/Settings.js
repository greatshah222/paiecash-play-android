import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { LarixUtils } from "./LarixUtils";

class Settings {
	onConfigChange = () => {
		console.log("onConfigChange NONE");
	};

	videoConfig = {
		cameraPos: "back",
		defaultBackCamera: "0",
		defaultFrontCamera: "1",
		res: "1920x1080",
		fps: "25",
		bitrate: 5000,
		format: "avc",
		keyframe: 2,
		liveRotation: "follow",
		orientation: "landscape",
	};

	audioConfig = {
		bitrate: 0,
		channels: 2,
		samples: 48000,
	};

	scoreboardConfig = {
		showPeriod: false,
		showScore: false,
		showScoreboard: false,
	};

	recordConfig = {
		enabled: false,
		segmentDuration: 0,
		snapshotFormat: "jpg",
		storageLocation: "photo://Larix",
		getPhotoFilename: this.getPhotoFilename,
		getVideoFilename: this.getVideoFilename,
	};

	loadConfig = async () => {
		console.log("loading video config");
		try {
			//AsyncStorage.removeItem('@videoConfig')
			let items = ["@videoConfig", "@audioConfig", "@recordConfig"];
			const result = await AsyncStorage.multiGet(items);
			result.forEach((v) => {
				let [key, jsonValue] = v;
				console.log(`read ${key}`);
				if (jsonValue !== null) {
					var config = JSON.parse(jsonValue);
					if (key == "@videoConfig") {
						Object.assign(this.videoConfig, config);
					} else if (key == "@audioConfig") {
						Object.assign(this.audioConfig, config);
					} else if (key == "@recordConfig") {
						Object.assign(this.recordConfig, config);
						this.recordConfig.getPhotoFilename = this.getPhotoFilename;
						this.recordConfig.getVideoFilename = this.getVideoFilename;
					}
				}
			});
		} catch (e) {
			console.log("Failed to load videoConfig");
			console.log(e);
		}
	};

	getVideoConfig = () => {
		return this.videoConfig;
	};

	saveVideoConfig = async (updVals) => {
		console.log("saveVideoConfig");
		console.log(updVals);
		var newConfig = {};
		Object.assign(newConfig, this.videoConfig, updVals);

		console.log(newConfig);
		try {
			var jsonValue = JSON.stringify(newConfig);
			AsyncStorage.setItem("@videoConfig", jsonValue).then(() => {
				this.videoConfig = newConfig;
				this.onConfigChange();
				console.log("Saved videoConfig");
			});
		} catch (e) {
			console.log("Failed to save videoConfig");
		}
	};

	getScoreboardConfig = () => {
		return this.scoreboardConfig;
	};
	saveScoreboardConfig = async (updVals) => {
		console.log("scoreboardConfig");
		console.log(updVals);
		var newConfig = {};
		Object.assign(newConfig, this.scoreboardConfig, updVals);

		console.log(newConfig);
		try {
			var jsonValue = JSON.stringify(newConfig);
			AsyncStorage.setItem("@scoreboardConfig", jsonValue).then(() => {
				this.scoreboardConfig = newConfig;
				this.onConfigChange();
				console.log("Saved scoreboardConfig");
			});
		} catch (e) {
			console.log("Failed to save scoreboardConfig");
		}
	};

	getAudioConfig = () => {
		return this.audioConfig;
	};

	saveAudioConfig = async (updVals) => {
		console.log("saveAudioConfig");
		var newConfig = {};
		Object.assign(newConfig, this.audioConfig, updVals);
		try {
			var jsonValue = JSON.stringify(newConfig);
			AsyncStorage.setItem("@audioConfig", jsonValue).then(() => {
				this.audioConfig = newConfig;
				this.onConfigChange();
				console.log("Saved audioConfig");
			});
		} catch (e) {
			console.log("Failed to save audioConfig");
		}
	};

	getRecordConfig = () => {
		return this.recordConfig;
	};

	saveRecordConfig = async (updVals) => {
		console.log("saveRecordConfig");
		var newConfig = {};
		Object.assign(newConfig, this.recordConfig, updVals);
		try {
			var jsonValue = JSON.stringify(newConfig);
			AsyncStorage.setItem("@recordConfig", jsonValue).then(() => {
				this.recordConfig = newConfig;
				this.onConfigChange();
				console.log("Saved recordConfig");
				console.log(newConfig);
			});
		} catch (e) {
			console.log("Failed to save recordConfig");
		}
	};

	getPhotoFilename = () => {
		let now = new Date();
		let baseName = LarixUtils.dateTimeToString(now);
		//TODO: check photo format
		return `IMG_${baseName}.jpg`;
	};

	getVideoFilename = () => {
		console.log("getVideoFilename");
		let now = new Date();
		let baseName = LarixUtils.dateTimeToString(now);
		console.log(baseName);
		if (Platform.OS == "android") {
			return `${baseName}.mp4`;
		} else {
			return `MVI_${baseName}.mov`;
		}
	};
}

var settings = new Settings();

export { settings };
