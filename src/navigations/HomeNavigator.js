import { StyleSheet, Button } from "react-native";
import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTranslation } from "react-i18next";

import {
	CONTACT_DETAIL,
	CREATE_CONTACT,
	EVENTS,
	SETTINGS,
	PROFILE,
	CAMERA,
	CONNECTIONS,
	CONNECTIONS_EDITOR,
	SETUP_VIDEO,
	SETUP_AUDIO,
	SETUP_RECORDING,
	LANGUAGE,
	SETUP_SCOREBOARD,
} from "../constants/routeNames";
import ContactDetailsScreen from "../screens/ContactDetailsScreen";
import EventScreen from "../screens/EventScreen";
import ProfileScreen from "../screens/ProfileScreen";
import MainScreen from "../screens/MainScreen";
import SetupRootScreen from "../screens/SetupRootScreen";
import SetupConnectionsList from "../screens/SetupConnectionsList";
import ConnectioEditorScreen from "../screens/ConnectionEditor";
import VideoSettingsScreen from "../screens/SetupVideo";
import AudioSettingsScreen from "../screens/SetupAudio";
import LanguageScreen from "../screens/LanguageScreen";
import SetUpScoreboardScreen from "../screens/SetUpScoreboardScreen";

// import RecordSettingsScreen from '../screens/SetupRecord';
// import CreateContactScreen from '../screens/CreateContactScreen';
// import SettingsScreen from '../screens/SettingsScreen';

const HomeNavigator = () => {
	const { t } = useTranslation();

	const HomeStack = createStackNavigator();
	console.log("home");
	return (
		<HomeStack.Navigator>
			<HomeStack.Screen
				name={EVENTS}
				component={EventScreen}
				options={{
					title: t("screens.games"),
				}}
			/>
			<HomeStack.Screen name={CONTACT_DETAIL} component={ContactDetailsScreen} />
			<HomeStack.Screen
				options={{ title: t("screens.profile") }}
				name={PROFILE}
				component={ProfileScreen}
			/>

			<HomeStack.Screen name={CAMERA} component={MainScreen} options={{ headerShown: false }} />
			<HomeStack.Screen
				name={LANGUAGE}
				component={LanguageScreen}
				options={{ title: t("screens.language") }}
			/>
			<HomeStack.Screen
				name={SETTINGS}
				component={SetupRootScreen}
				options={{ title: t("screens.settings") }}
			/>

			<HomeStack.Screen
				name={SETUP_SCOREBOARD}
				component={SetUpScoreboardScreen}
				options={{ title: t("screens.settings") }}
			/>
			<HomeStack.Screen
				name={CONNECTIONS}
				component={SetupConnectionsList}
				options={{ title: t("screens.currentConnections") }}
			/>
			<HomeStack.Screen
				name={CONNECTIONS_EDITOR}
				component={ConnectioEditorScreen}
				options={{ title: t("screens.connection") }}
			/>
			<HomeStack.Screen
				name={SETUP_VIDEO}
				component={VideoSettingsScreen}
				options={{ title: t("screens.video") }}
			/>
			<HomeStack.Screen
				name={SETUP_AUDIO}
				component={AudioSettingsScreen}
				options={{ title: t("screens.audio") }}
			/>
			{/* <HomeStack.Screen
        name={SETUP_RECORDING}
        component={RecordSettingsScreen}
        options={{ title: 'Recording' }}
      /> */}
		</HomeStack.Navigator>
	);
};

export default HomeNavigator;

const styles = StyleSheet.create({});
