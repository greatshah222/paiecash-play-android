import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, Text, View, ScrollView } from "react-native";
import { material, systemWeights } from "react-native-typography";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";

import { settings } from "../components/Larix/Settings";
import colors from "../assets/themes/colors";
import CustomSwitch from "../components/common/CustomSwitch";

const SetUpScoreboardScreen = () => {
	const { t } = useTranslation();

	const [scoreboardConfig, setScoreboardConfig] = useState(null);

	const [showScoreboard, setShowScoreboard] = useState(false);
	const [showPeriod, setShowPeriod] = useState(false);
	const [showScore, setShowScore] = useState(false);

	useEffect(() => {
		const getScoreboardConfig = async () => {
			let value = await AsyncStorage.getItem("@scoreboardConfig");
			value = JSON.parse(value);

			setScoreboardConfig(value || {});
			setShowScoreboard(value?.showScoreboard);

			setShowPeriod(value?.showPeriod);

			setShowScore(value?.showScore);
		};

		getScoreboardConfig();
	}, []);

	const showScoreBoardHandler = async () => {
		setShowScoreboard((prev) => !prev);
		await settings.saveScoreboardConfig({
			showScoreboard: !showScoreboard,
			showPeriod,
			showScore,
		});
	};
	const showScoreHandler = async () => {
		setShowScore((prev) => !prev);
		await settings.saveScoreboardConfig({
			showScoreboard,
			showPeriod,
			showScore: !showScore,
		});
	};
	const showPeriodHandler = async () => {
		setShowPeriod((prev) => !prev);
		await settings.saveScoreboardConfig({
			showScoreboard,
			showPeriod: !showPeriod,
			showScore,
		});
	};

	if (!scoreboardConfig) return null;

	return (
		<SafeAreaView
			style={{ marginHorizontal: 10, flex: 1, maxWidth: "90%" }}
			edges={["top", "left"]}
		>
			<ScrollView
				style={{
					flex: 1,
				}}
			>
				<View style={styles.leftControls}>
					<View>
						<Text
							style={[
								styles.text,
								{
									...material.title,
									color: colors.primary,
									marginVertical: 10,
								},
							]}
						>
							{t("scoreboard.show")}
						</Text>
					</View>

					<View style={styles.leftControls_item}>
						<CustomSwitch
							value={showPeriod}
							onChange={(val) => {
								showPeriodHandler(val);
							}}
							label={t("scoreboard.period")}
						/>
					</View>
					<View style={styles.leftControls_item}>
						<CustomSwitch
							value={showScoreboard}
							onChange={(val) => {
								showScoreBoardHandler(val);
							}}
							label={t("scoreboard.scoreboard")}
						/>
					</View>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
};

export default SetUpScoreboardScreen;

const styles = StyleSheet.create({
	text: {
		...material.subheading,
		...systemWeights.semibold,

		color: colors.black,
		flex: 1,
	},

	leftControls: {
		flex: 1,
		width: "100%",
	},
	leftControls_item: {
		alignItems: "center",
		marginTop: 10,
		flexDirection: "row",
	},

	textCenter: {
		textAlign: "center",
	},
});
