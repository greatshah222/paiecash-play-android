import React, { useMemo } from "react";
import { StyleSheet, View, Text, StatusBar, Platform } from "react-native";
import { material, systemWeights } from "react-native-typography";
import { Picker } from "@react-native-picker/picker";
import { useTranslation } from "react-i18next";

import CustomPressable from "../common/CustomPressable";
import colors from "../../assets/themes/colors";

const formatNumber = (number) => `0${number}`.slice(-2);

const createArray = (length) => {
	const arr = [];
	for (let i = 0; i < length; i++) {
		arr.push(formatNumber(i));
	}
	return arr;
};

const AVAILABLE_MINUTES = createArray(59);
const AVAILABLE_SECONDS = createArray(60);

const ScoreboardTimer = ({
	isRunning,
	selectedMinutes,
	selectedSeconds,
	setSelectedMinutes,
	setSelectedSeconds,
	start,
	stop,
}) => {
	// console.log("timer re-rendering");
	const { t } = useTranslation();

	const formattedSelectedMinutes = useMemo(() => formatNumber(selectedMinutes), [selectedMinutes]);
	const formattedSelectedSeconds = useMemo(() => formatNumber(selectedSeconds), [selectedSeconds]);

	const renderPickers = () => (
		<View style={styles.pickerContainer}>
			{isRunning ? (
				<View
					style={[
						styles.timerTextContainer,
						{
							marginRight: 5,
						},
					]}
				>
					<Text>{formattedSelectedMinutes}</Text>
				</View>
			) : (
				<Picker
					style={[
						styles.picker,
						{
							opacity: isRunning ? 0.9 : 1,
							marginRight: 5,
						},
					]}
					itemStyle={styles.pickerItem}
					selectedValue={formattedSelectedMinutes}
					onValueChange={(itemValue) => {
						setSelectedMinutes(itemValue);
					}}
					enabled={isRunning ? false : true} // enabled is like disabled
					mode="dropdown"
				>
					{AVAILABLE_MINUTES.map((value) => (
						<Picker.Item key={value} label={value} value={value} />
					))}
				</Picker>
			)}

			{isRunning ? (
				<View style={styles.timerTextContainer}>
					<Text>{formattedSelectedSeconds}</Text>
				</View>
			) : (
				<Picker
					style={[
						styles.picker,
						{
							opacity: isRunning ? 0.9 : 1,
						},
					]}
					itemStyle={styles.pickerItem}
					selectedValue={formattedSelectedSeconds}
					// dropdownIconColor={colors.white} // HIDING ICON IN ANDROID NEED TO CHECK IN IOS
					onValueChange={(itemValue) => {
						setSelectedSeconds(itemValue);
					}}
					enabled={isRunning ? false : true} // enabled is like disabled
					mode="dropdown"
				>
					{AVAILABLE_SECONDS.map((value) => (
						<Picker.Item key={value} label={value} value={value} />
					))}
				</Picker>
			)}
		</View>
	);

	const clockButtonhandler = () => {
		isRunning ? stop() : start();
	};

	return (
		<View style={styles.container}>
			<StatusBar barStyle="light-content" />
			{renderPickers()}

			{isRunning ? (
				<CustomPressable
					style={[styles.clockButton, styles.stop]}
					onPress={() => {
						clockButtonhandler();
					}}
				>
					<Text style={styles.text}>{t("scoreboard.stop")}</Text>
				</CustomPressable>
			) : (
				<CustomPressable
					style={styles.clockButton}
					onPress={() => {
						clockButtonhandler();
					}}
				>
					<Text style={styles.text}>{t("scoreboard.start")}</Text>
				</CustomPressable>
			)}
		</View>
	);
};

export default ScoreboardTimer;

const styles = StyleSheet.create({
	container: {
		alignItems: "center",
		justifyContent: "center",
		flexDirection: "row",
	},

	timerTextContainer: {
		justifyContent: "center",
		flex: 1,
		width: "100%",
		height: "100%",
		alignItems: "center",
		backgroundColor: colors.white,
		opacity: 0.8,
	},

	clockButton: {
		borderColor: colors.grey,
		borderWidth: 2,
		borderRadius: 20,
		justifyContent: "center",

		alignItems: "center",
		width: 100,
		marginHorizontal: 5,

		height: 40,
	},

	stop: {
		backgroundColor: colors.danger,
	},
	text: {
		...material.subheading,
		color: colors.white,
		...systemWeights.bold,
	},
	pickerContainer: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 15,
		overflow: "hidden",
		height: 40,
		width: 210,
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
				color: colors.black,
				backgroundColor: colors.white,
				height: 40,
				maxHeight: 40,
			},
			ios: {
				color: colors.black,
				backgroundColor: colors.white,
				height: 40,
				maxHeight: 40,
			},
		}),
	},
});
