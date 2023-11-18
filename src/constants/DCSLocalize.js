import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as RNLocalize from "react-native-localize";

import translationEN from "./translations/locales/en_US.json";
import translationFI from "./translations/locales/fi_FI.json";
import translationFR from "./translations/locales/fr.json";

const LANG_CODES = ["en", "fi", "fr"];

const resources = {
	en: {
		translation: translationEN,
	},
	fi: {
		translation: translationFI,
	},
	fr: {
		translation: translationFR,
	},
};
const LANGUAGE_DETECTOR = {
	type: "languageDetector",
	async: true,
	detect: (callback) => {
		AsyncStorage.getItem("language", (err, language) => {
			if (err || !language) {
				if (err) {
					console.log("Error fetching Languages from asyncstorage ", err);
				} else {
					console.log("No language is set, choosing English as fallback");
				}
				const findBestAvailableLanguage = RNLocalize.findBestAvailableLanguage(LANG_CODES);
				callback(findBestAvailableLanguage.languageTag || "fr");
				return;
			}
			callback(language);
		});
	},
	init: () => {},
	cacheUserLanguage: (language) => {
		AsyncStorage.setItem("language", language);
	},
};
i18n
	.use(LANGUAGE_DETECTOR)
	.use(initReactI18next)
	.init({
		// for android version starts
		compatibilityJSON: "v3",
		// for android version ends

		resources: resources,
		react: {
			useSuspense: false,
		},
		interpolation: {
			escapeValue: false,
		},
	});
