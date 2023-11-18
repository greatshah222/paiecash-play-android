import { StyleSheet, Text, View } from "react-native";
import React, { useEffect, useState } from "react";
import Settings from "../components/Settings/Settings";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTranslation } from "react-i18next";

const LanguageScreen = () => {
	const { i18n, t } = useTranslation();

	const [languageItems, setLanguageItems] = React.useState([]);

	const [modalVisible, setmodalVisible] = useState(false);

	const LANGUAGES = [
		{ code: "en", label: t("languageScreen.english") },
		{ code: "fi", label: t("languageScreen.finnish") },
		{ code: "fr", label: t("languageScreen.french") },
	];
	const [currentLanguage, setCurrentLanguage] = useState(
		LANGUAGES.find((el) => el.code === i18n.language)?.label
	);

	useEffect(() => {
		let languageSetting = [];

		LANGUAGES.map((el) => {
			languageSetting.push({
				name: el.label,
				onPress: () => {
					setCurrentLanguage(el.label);

					saveSetting("language", el.code);
					i18n.changeLanguage(el.code);
				},
				selected: currentLanguage === el.label,
			});
		});

		setLanguageItems(languageSetting);
	}, [currentLanguage]);

	const settingsOptions = [
		{
			title: t("languageScreen.changeLanguage"),
			subTitle: t(`${[currentLanguage]}`),
			onPress: () => {
				setmodalVisible(true);
			},
		},
	];
	const saveSetting = async (key, value) => {
		console.log("key,value", key, value);

		try {
			await AsyncStorage.setItem(key, JSON.stringify(value));
			setmodalVisible(false);
		} catch (error) {
			console.log(error, "error1");
		}
	};

	return (
		<Settings
			settingsOptions={settingsOptions}
			modalVisible={modalVisible}
			setModalVisible={setmodalVisible}
			VideoQualityPreference={languageItems}
		/>
	);
};

export default LanguageScreen;

const styles = StyleSheet.create({});
