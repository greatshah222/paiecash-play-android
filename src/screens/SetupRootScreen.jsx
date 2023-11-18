import React from "react";
import {
	NativeModules,
	StyleSheet,
	View,
	Text,
	FlatList,
	TouchableOpacity,
	Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import {
	CONNECTIONS,
	EVENTS,
	SETUP_AUDIO,
	SETUP_SCOREBOARD,
	SETUP_VIDEO,
} from "../constants/routeNames";
import Icon from "../components/common/Icon";

const SetupRootScreen = ({ navigation, route }) => {
	const { t } = useTranslation();

	const { setOptions, toggleDrawer } = useNavigation();
	const items = [
		{
			title: t("screens.video"),
			targetScreen: SETUP_VIDEO,
		},
		{
			title: t("screens.audio"),

			targetScreen: SETUP_AUDIO,
		},
		{
			title: t("screens.scoreboard"),

			targetScreen: SETUP_SCOREBOARD,
		},
	];

	React.useLayoutEffect(() => {
		setOptions({
			headerLeft: () => (
				<Pressable onPress={() => navigation.navigate(EVENTS)}>
					<Icon name="arrow-back" type="material" size={25} style={styles.icomenu} />
				</Pressable>
			),
		});
	}, []);

	const renderItem = ({ item }) => (
		<View>
			<TouchableOpacity
				style={styles.item}
				onPress={() => {
					console.log("Navigate to " + item.title);
					navigation.navigate(item.targetScreen);
				}}
			>
				<Text style={styles.text}>{item.title}</Text>
			</TouchableOpacity>
		</View>
	);
	return (
		<SafeAreaView edges={["top", "left"]} style={styles.container}>
			<FlatList data={items} renderItem={renderItem} keyExtractor={(item) => item.targetScreen} />
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		justifyContent: "space-between",
		flex: 1,
	},
	item: {
		alignContent: "flex-start",
		padding: 10,
	},
	text: {
		fontSize: 16,
	},
	icomenu: {
		padding: 10,
	},
	ver: {
		borderTopColor: "#555",
		width: "100%",
		borderTopWidth: 2,
		paddingLeft: 10,
		paddingTop: 10,
		paddingBottom: 60,
		backgroundColor: "#cccccc",
	},
});

export default SetupRootScreen;
