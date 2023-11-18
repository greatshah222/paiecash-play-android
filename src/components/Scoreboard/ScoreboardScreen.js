import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React, { useCallback, useState, useEffect } from "react";
import { useRoute } from "@react-navigation/native";

import { material, systemWeights } from "react-native-typography";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";
import { useTranslation } from "react-i18next";

import CustomPressable from "../common/CustomPressable";
import colors from "../../assets/themes/colors";
import Icon from "../common/Icon";

import { scoreBoardHandler } from "../../utils/dataHandler";
import { GlobalContext } from "../../context/reducers/Provider";
import { checkScoreboardInitialStatus } from "../../lib/check-scoreboard-initial-status";

import ScoreboardTimer from "./ScoreboardTimer";

const formatNumber = (number) => `0${number}`.slice(-2);

const getRemaining = (time) => {
	const minutes = Math.floor(time / 60);
	const seconds = time - minutes * 60;
	return { minutes: formatNumber(minutes), seconds: formatNumber(seconds) };
};

let interval = null;

const USE_UPDATED_API_ENDPOINT = true;

const ScoreboardTimerMemoized = ScoreboardTimer;

const AVAILABLE_PERIOD = ["P0", "P1", "P2", "P3", "E1", "E2", "E3"];

const ScoreboardScreen = ({
	startStream,
	isStreaming,
	mute,
	toggleMute,
	backToMainPage,
	gotToSettingsPage,
	isStreamingState,
}) => {
	const { params } = useRoute();
	const { t } = useTranslation();

	const { user } = React.useContext(GlobalContext);

	let token = user?.token && JSON.parse(user?.token);

	const [scoreTeamA, setScoreTeamA] = useState(0);
	const [scoreTeamB, setScoreTeamB] = useState(0);

	const [gamePeriod, setGamePeriod] = useState(null);

	const [updateScore, setUpdateScore] = useState(null);
	const [updatePeriod, setUpdatePeriod] = useState(null);

	const [scoreLoading, setScoreLoading] = useState(false);

	const [showPeriod, setShowPeriod] = useState(true);
	const [showScoreboard, setShowScoreboard] = useState(true);

	const [isAlreadyInitiated, setisAlreadyInitiated] = useState(false);

	const [hasFetchedLocalStorageConfig, setHasFetchedLocalStorageConfig] = useState(false);

	const [currentSeconds, setCurrentSeconds] = useState(0);
	const [isRunning, setIsRunning] = useState(false);
	const [selectedMinutes, setSelectedMinutes] = useState("0");
	const [selectedSeconds, setSelectedSeconds] = useState("0");

	const start = useCallback(async () => {
		setIsRunning(true);

		const data = {
			timerStatus: "START",
			streamName: params?.event?.event?.publishingInfo?.serviceId,
		};

		// IF THERE IS SOME TIME IN MINUTES AND SECONDS WE SEND TO BACKEDN
		if (selectedMinutes * 60 * 1000 + selectedSeconds * 1000 > 0) {
			data.time = selectedMinutes * 60 * 1000 + selectedSeconds * 1000;
		}

		await scoreBoardHandler(data, token, USE_UPDATED_API_ENDPOINT);

		setCurrentSeconds(parseInt(selectedMinutes, 10) * 60 + parseInt(selectedSeconds, 10));
	}, [params, token, USE_UPDATED_API_ENDPOINT, selectedMinutes, selectedSeconds]);
	useEffect(() => {
		let interval;
		if (isRunning) {
			interval = setInterval(() => {
				setCurrentSeconds((prevCurrentSeconds) => prevCurrentSeconds + 1);
			}, 1000);
		} else {
			clearInterval(interval);
		}

		return () => clearInterval(interval);
	}, [isRunning]);
	useEffect(() => {
		if (currentSeconds) {
			const { minutes, seconds } = getRemaining(currentSeconds);
			setSelectedMinutes(minutes.toString());
			setSelectedSeconds(seconds.toString());
		}
	}, [currentSeconds]);

	const stop = async () => {
		const data = {
			timerStatus: "STOP",
			streamName: params?.event?.event?.publishingInfo?.serviceId,
		};

		console.log("i am stopiing");

		await scoreBoardHandler(data, token, USE_UPDATED_API_ENDPOINT);

		clearInterval(interval);
		interval = null;
		const { minutes, seconds } = getRemaining(currentSeconds);
		setSelectedMinutes(minutes.toString());
		setSelectedSeconds(seconds.toString());
		setIsRunning(false);
	};

	useEffect(() => {
		const checkInitialScoreboardStatus = async () => {
			let {
				isAlreadyInitiated: isAlreadyInitiatedLocal,
				currentStreamScoreboardParams: currentScoreboardParamsLocal,
			} = await checkScoreboardInitialStatus(
				params?.event?.event?.publishingInfo?.serviceId,
				token,
				"live",
				params?.event?.gameId,
				showScoreboard
			);

			if (
				(!isAlreadyInitiatedLocal || typeof isAlreadyInitiated === "undefined") &&
				showScoreboard
			) {
				// IF NOT INITIATED WE HAVE SHOWSCOREBOARD AS TRUE WE NEED TO INITIATE THE SCOREBOARD

				const data = {
					streamName: params?.event?.event?.publishingInfo?.serviceId,
					enable: true,
					scoreboardSecondTeam: params?.event?.awayTeamName || "Guest",

					scoreboardFirstTeam: params?.event?.homeTeamName || "Home",

					scoreboardImage: "scoreboard.png",
					scoreboardImageLocation: "10,0",
					scoreboardFirstTeamLocation: "5,10",
					scoreboardSecondTeamLocation: "240,10",
					scoreboardPeriodLocation: "235,35",
					scoreboardScoreLocation: "175,10",
					scoreboardTimerLocation: "170,35",
					scoreboardFontColor: "#ffffff",
					scoreboardFontSize: "18",
					scoreboardTeamFontColor: "#161b55",

					// font
					font: "Heading Pro Treble",
					// pass this as true so it will be given in the response later
					scoreboardShowScore: true,
					// we will pass gameId here
					lowerThirdText: params?.event?.gameId,
				};

				await scoreBoardHandler(data, token);

				setisAlreadyInitiated(true);
			}

			if (isAlreadyInitiatedLocal) {
				setisAlreadyInitiated(true);
			}

			if (currentScoreboardParamsLocal?.wowzaResponse?.scoreboardStatus?.timerStatus === "START") {
				let curTime =
					Date.now() -
					currentScoreboardParamsLocal?.wowzaResponse?.scoreboardStatus?.timerStart * 1;

				let minutesLocal = Math.floor(curTime / 60000);

				let secondsLocal = Math.floor((curTime % 60000) / 1000);

				setSelectedMinutes(minutesLocal * 1);
				setSelectedSeconds(secondsLocal * 1);
				setIsRunning(true);

				setCurrentSeconds(Math.floor(curTime / 1000));
			} else {
				// timer is stopeed

				if (currentScoreboardParamsLocal?.wowzaResponse?.scoreboardStatus?.timerStart) {
					let curTime =
						currentScoreboardParamsLocal?.wowzaResponse?.scoreboardStatus?.prevTimer * 1;
					setCurrentSeconds(curTime / 1000);
				}
			}

			if (currentScoreboardParamsLocal?.wowzaResponse?.scoreboardStatus?.period) {
				setGamePeriod(currentScoreboardParamsLocal?.wowzaResponse?.scoreboardStatus?.period);
			}

			let currentGuestGoal =
				currentScoreboardParamsLocal?.wowzaResponse?.scoreboardStatus?.scoreRight;
			let currentHomeGoal =
				currentScoreboardParamsLocal?.wowzaResponse?.scoreboardStatus?.scoreLeft;

			setScoreTeamA(currentHomeGoal || 0);
			setScoreTeamB(currentGuestGoal || 0);
		};

		hasFetchedLocalStorageConfig &&
			isStreamingState &&
			!isAlreadyInitiated &&
			checkInitialScoreboardStatus();

		// DO API CALL ONLY IF IT IS CURRENTLY STREAMING AND HAS FETCHED LOCAL STORAGE VALUE
	}, [hasFetchedLocalStorageConfig, showScoreboard, isStreamingState, isAlreadyInitiated]);

	// WE NEED TO GET THE SCOREBOARD CONFIG FROM OUR SETTINGS

	useEffect(() => {
		const getScoreboardConfig = async () => {
			let value = await AsyncStorage.getItem("@scoreboardConfig");

			value = JSON.parse(value);

			setShowScoreboard(value?.showScoreboard);

			setShowPeriod(value?.showPeriod);

			// setShowScore(value?.showScore);
			setHasFetchedLocalStorageConfig(true);
		};

		!hasFetchedLocalStorageConfig && getScoreboardConfig();
	}, [hasFetchedLocalStorageConfig]);

	useEffect(() => {
		// we update request every 1.5 s after user changes score

		const delayDebounceFn = setTimeout(async () => {
			if (updateScore?.streamName) {
				await scoreBoardHandler(updateScore, token, USE_UPDATED_API_ENDPOINT);
				setUpdateScore(null);
				setScoreLoading(false);
			}
		}, 1000);

		return () => clearTimeout(delayDebounceFn);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [updateScore]);

	useEffect(() => {
		// we update request every 1.5 s after user changes score
		const delayDebounceFn = setTimeout(async () => {
			if (updatePeriod?.streamName) {
				// if we send any period to backend ->it auto shows the period even ifit was hidden
				setShowPeriod(true);
				await scoreBoardHandler(updatePeriod, token, USE_UPDATED_API_ENDPOINT);
				setUpdatePeriod(null);
			}
		}, 1000);

		return () => clearTimeout(delayDebounceFn);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [updatePeriod]);

	// we need to update

	const teamScoreHandler = async (val, type) => {
		let data = {
			streamName: params?.event?.event?.publishingInfo?.serviceId,
		};

		if (type === "home") {
			data.scoreLeft = val;
			setScoreTeamA(val);
		} else {
			data.scoreRight = val;
			setScoreTeamB(val);
		}
		setUpdateScore(data);
		setScoreLoading(true);
	};
	const setTeamScoreHandler = (val, type) => {
		teamScoreHandler(val, type);
	};

	const periodChangeHandler = (val) => {
		setGamePeriod(val);
		let data = {
			streamName: params?.event?.event?.publishingInfo?.serviceId,
		};

		data.period = val;
		setUpdatePeriod(data);
	};

	const LeftControls = () => {
		return (
			<View style={styles.leftControls}>
				<CustomPressable
					style={[
						styles.decrement,
						{
							backgroundColor: colors.black,
						},
					]}
					onPress={backToMainPage}
					disabled={isStreaming}
				>
					<Text style={styles.text}>
						<Icon name="exit" color={colors.white} size={24} type={"ionicon"} />
					</Text>
				</CustomPressable>
				<CustomPressable
					style={[
						styles.decrement,
						{
							backgroundColor: colors.black,
						},
					]}
					onPress={gotToSettingsPage}
					disabled={isStreaming}
				>
					<Text style={styles.text}>
						<Icon name="settings" color={colors.white} size={24} type={"ionicon"} />
					</Text>
				</CustomPressable>
			</View>
		);
	};

	const BottomControls = () => {
		return (
			<View style={styles.bottomControls}>
				<View style={styles.bottomGoalContainer}>
					<Text
						style={[
							styles.text,
							styles.marginRight,
							{
								width: 60,
							},
						]}
						numberOfLines={2}
					>
						{t("scoreboard.homeGoals")}
					</Text>

					<CustomPressable
						style={styles.decrement}
						onPress={() => {
							let scoreA = scoreTeamA * 1;
							setTeamScoreHandler(scoreA - 1, "home");
						}}
						disabled={scoreTeamA * 1 === 0 || scoreLoading}
					>
						<Text style={styles.text}>
							<Icon name="minus" color={colors.white} size={24} type={"entypo"} />
						</Text>
					</CustomPressable>
					<CustomPressable
						style={styles.increment}
						onPress={async () => {
							let scoreA = scoreTeamA * 1;
							setTeamScoreHandler(scoreA + 1, "home");
						}}
						disabled={scoreLoading}
					>
						<Text style={styles.text}>
							<Icon name="plus" color={colors.white} size={24} type={"entypo"} />
						</Text>
					</CustomPressable>
				</View>

				<View style={styles.clockContainer}>
					<ScoreboardTimerMemoized
						currentSeconds={currentSeconds}
						isRunning={isRunning}
						selectedMinutes={selectedMinutes}
						selectedSeconds={selectedSeconds}
						setCurrentSeconds={setCurrentSeconds}
						setIsRunning={setIsRunning}
						setSelectedMinutes={setSelectedMinutes}
						setSelectedSeconds={setSelectedSeconds}
						start={start}
						stop={stop}
					/>
				</View>
				<View style={styles.bottomGoalContainer}>
					<Text
						style={[
							styles.text,
							styles.marginRight,
							{
								width: 60,
							},
						]}
						numberOfLines={2}
					>
						{t("scoreboard.guestGoals")}
					</Text>

					<CustomPressable
						style={styles.decrement}
						onPress={() => {
							let scoreB = scoreTeamB;
							setTeamScoreHandler(scoreB - 1, "away");
						}}
						disabled={scoreTeamB * 1 === 0 || scoreLoading}
					>
						<Text style={styles.text}>
							<Icon name="minus" color={colors.white} size={24} type={"entypo"} />
						</Text>
					</CustomPressable>
					<CustomPressable
						style={styles.increment}
						onPress={() => {
							let scoreB = scoreTeamB;
							setTeamScoreHandler(scoreB + 1, "away");
						}}
						disabled={scoreLoading}
					>
						<Text style={styles.text}>
							<Icon name="plus" color={colors.white} size={24} type={"entypo"} />
						</Text>
					</CustomPressable>
				</View>
			</View>
		);
	};

	const RightControls = () => {
		return (
			<View style={styles.rightControls}>
				<CustomPressable
					onPress={toggleMute}
					style={[
						styles.decrement,
						{
							backgroundColor: colors.black,
						},
					]}
					disabled={!isStreaming}
				>
					<Text style={styles.text}>
						<Icon
							name={!mute ? "microphone" : "microphone-slash"}
							color={colors.white}
							size={22}
							type={"fa"}
						/>
					</Text>
				</CustomPressable>

				<TouchableOpacity onPress={startStream} style={[styles.bigButton]}>
					{/* <Image
						source={
							isStreaming
								? require("../../assets/images/larixImg/stop.png")
								: require("../../assets/images/larixImg/start.png")
						}
						style={[
							styles.decrement,
							{
								backgroundColor: colors.black,
								padding: 0,
								width: 60,
								height: 60,
								justifyContent: "center",
								alignItems: "center",
							},
						]}
					/> */}

					<Icon
						name="record"
						color={isStreaming ? "red" : colors.white}
						size={isStreaming ? 40 : 46}
						type="materialCommunity"
					/>
				</TouchableOpacity>
			</View>
		);
	};

	const TopControls = () => {
		return (
			<View
				style={[
					styles.container,
					{
						flex: 1,
						height: isStreamingState && isAlreadyInitiated && isStreaming ? 70 : "auto",
					},
				]}
			>
				{isStreamingState && isAlreadyInitiated && isStreaming && (
					<View style={styles.teamContainer}>
						<View style={styles.teamText}>
							<Text style={styles.text}>{params?.event?.homeTeamName}</Text>
							<Text style={styles.text}>{scoreTeamA}</Text>
						</View>
						<View style={styles.teamText}>
							<Text style={styles.text}>{params?.event?.awayTeamName}</Text>
							<Text style={styles.text}>{scoreTeamB}</Text>
						</View>
					</View>
				)}

				{/* period changes */}
				{showPeriod && isStreamingState && isAlreadyInitiated && isStreaming && (
					<View
						style={{
							width: 50,
							height: "100%",
							flex: 1,
							padding: 10,
							flexDirection: "row",
							justifyContent: "center",
							alignItems: "center",
						}}
					>
						{isRunning ? (
							<Text
								style={[
									styles.text,
									{
										width: 100,
									},
								]}
							>
								{gamePeriod}
							</Text>
						) : (
							<Picker
								style={[
									styles.picker,
									{
										opacity: isRunning ? 0.9 : 1,
									},
								]}
								itemStyle={styles.pickerItem}
								selectedValue={gamePeriod}
								dropdownIconColor={colors.white} // HIDING ICON IN ANDROID NEED TO CHECK IN IOS
								onValueChange={(itemValue) => {
									periodChangeHandler(itemValue);
								}}
								enabled={isRunning ? false : true} // enabled is like disabled
								mode="dropdown"
							>
								{AVAILABLE_PERIOD.map((value) => (
									<Picker.Item key={value} label={value} value={value} />
								))}
							</Picker>
						)}

						<Text style={styles.text}>{t("scoreboard.period")}</Text>
					</View>
				)}
			</View>
		);
	};

	return (
		<View style={styles.mainContainer}>
			<View style={styles.controls}>
				<TopControls />
				<LeftControls />

				{isStreamingState && isAlreadyInitiated && isStreaming && <BottomControls />}

				<RightControls />
			</View>
		</View>
	);
};

export default ScoreboardScreen;

const styles = StyleSheet.create({
	controls: {
		flex: 1,
		position: "relative",
		height: "100%",
	},
	container: {
		flexDirection: "row",
		display: "flex",

		position: "absolute",
		top: 0,
		left: 100,
		right: 100,
		backgroundColor: colors.scoreboardBackground,
	},

	textContainer: {
		flex: 0.8,
		flexDirection: "row",
		justifyContent: "space-between",
		paddingHorizontal: 20,
		marginHorizontal: 10,
	},

	textContainer_primary: {
		alignItems: "center",
		justifyContent: "space-around",
	},
	buttonContainer: {
		justifyContent: "space-between",
	},

	increment: {
		padding: 10,
		borderRadius: 100,
		borderColor: colors.white,
		borderWidth: 2,
		paddingHorizontal: 10,
	},

	decrement: {
		padding: 10,
		borderRadius: 100,

		borderColor: colors.white,
		borderWidth: 2,
		marginRight: 10,
	},

	text: {
		...material.subheading,
		...systemWeights.semibold,

		color: colors.white,
	},

	leftControls: {
		maxWidth: 100,
		width: "100%",
		padding: 10,
		borderBottomLeftRadius: 10,

		borderBottomRightRadius: 10,

		position: "absolute",
		bottom: 70,
		left: 0,
		height: "60%",
		display: "flex",
		justifyContent: "space-around",
		alignItems: "center",
	},

	bottomControls: {
		position: "absolute",
		bottom: 0,
		backgroundColor: colors.scoreboardBackground,
		width: "100%",
		flexDirection: "row",
		justifyContent: "space-between",
		height: 70,
		paddingVertical: 10,
		maxHeight: 70,
		paddingHorizontal: 20,
	},

	bottomGoalContainer: {
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
	},

	clockContainer: {
		flex: 1,
		flexDirection: "row",
		justifyContent: "space-around",
		alignItems: "flex-end",
	},

	inputLeft: {
		color: "black",
		backgroundColor: colors.white,
		padding: 5,
		height: 30,
		width: 30,
		borderBottomLeftRadius: 5,
		borderTopLeftRadius: 5,
		fontWeight: "bold",
		marginRight: 5,
	},
	inputRight: {
		color: "black",
		backgroundColor: colors.white,
		padding: 5,
		height: 30,
		width: 30,
		borderBottomRightRadius: 5,
		borderTopRightRadius: 5,
		fontWeight: "bold",
	},

	clockButton: {
		borderColor: colors.grey,
		borderWidth: 2,
		borderRadius: 20,
		justifyContent: "center",

		alignItems: "center",
		width: 100,
		marginHorizontal: 5,
		height: "80%",
	},

	marginRight: {
		marginRight: 5,
	},

	marginLeft: {
		marginLeft: 5,
	},

	marginBottom: {
		marginBottom: 5,
	},

	textCenter: {
		textAlign: "center",
	},

	flexRow: {
		flexDirection: "row",
	},
	rightControls: {
		position: "absolute",
		maxWidth: 100,
		width: "100%",
		flex: 1,
		bottom: 70,
		right: 0,
		paddingTop: 10,

		height: "60%",
		justifyContent: "space-around",
		alignItems: "center",
		borderTopLeftRadius: 10,

		borderBottomLeftRadius: 10,
	},

	roundButton: {
		borderRadius: 20,
		width: 40,
		height: 40,
		backgroundColor: "hsla(0, 0%, 30%, 0.3)",
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
		margin: 1,
	},
	disabledStyle: {
		opacity: 0.5,
		backgroundColor: "hsla(0, 0%, 10%, 0.3)",
	},

	bigButton: {
		marginTop: 10,
		borderRadius: 50,
		height: 50,
		width: 50,
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
		borderWidth: 1,
		borderColor: colors.white,
	},

	redDot: {
		width: 24,
		height: 24,
		borderRadius: 12,
		backgroundColor: "red",
	},

	pickerItem: {
		color: colors.white,

		...Platform.select({
			android: {
				marginLeft: 10,
				marginRight: 10,
			},
			ios: {
				height: 40,
			},
		}),
	},

	picker: {
		flex: 1,
		maxWidth: 100,
		height: 40,

		...Platform.select({
			android: {
				height: 40,
				maxHeight: 40,
			},
		}),
		color: colors.white,
	},

	teamContainer: {
		height: "100%",
		flex: 2,
		flexDirection: "row",
		justifyContent: "space-around",
		alignItems: "center",
		padding: 10,
	},

	teamText: {
		justifyContent: "center",
		alignItems: "center",
	},

	mainContainer: {
		position: "absolute",
		top: 0,
		bottom: 0,
		left: 0,
		right: 0,
	},
});
