import { StyleSheet, Text, View, Image, Pressable } from "react-native";
import React from "react";
import { useTranslation } from "react-i18next";

import Input from "../common/Input";
import CustomButton from "../common/CustomButton";
import { useNavigation } from "@react-navigation/native";
import colors from "../../assets/themes/colors";
import Message from "../common/Message";

const Login = ({ onSubmit, onChange, form, errors, error, loading, justSignedUp }) => {
	const navigation = useNavigation();
	const { t } = useTranslation();

	console.log(form);

	const [isSecureEntry, setIsSecureEntry] = React.useState(true);
	return (
		<>
			<Image source={require("../../assets/images/logo.png")} style={styles.logo} />
			<View style={styles.form}>
				<Text style={styles.title}>{t("signup.welcome")}</Text>
				<Text style={styles.subTitle}>{t("login.loginHere")}</Text>

				{error?.error && (
					<Message
						message={error?.error}
						danger
						retry
						retryFn={() => console.log("222", 222)}
						onDismiss={() => {}}
					/>
				)}
				{justSignedUp && (
					<Message message={t("login.accountSuccess")} success onDismiss={() => {}} />
				)}
				<Input
					label={t("signup.email")}
					placeholder={t("signup.emailPlaceHolder")}
					onChangeText={(value) => {
						onChange({ name: "EMAIL", value });
					}}
					error={errors.EMAIL || error?.email?.[0]}
				/>

				<Input
					label={t("signup.password")}
					placeholder={t("signup.passwordPlaceHolder")}
					icon={
						<Pressable
							onPress={() => setIsSecureEntry((prev) => !prev)}
							style={({ pressed }) => pressed && { opacity: 0.5 }}
						>
							<Text>{!isSecureEntry ? t("login.hide") : t("login.show")}</Text>
						</Pressable>
					}
					iconPosition="right"
					secureTextEntry={isSecureEntry}
					onChangeText={(value) => {
						onChange({ name: "PASSWORD", value });
					}}
					error={errors.PASSWORD || error?.password?.[0]}
				/>
				<CustomButton
					title={t("screens.login")}
					onPress={onSubmit}
					primary
					loading={loading}
					disabled={
						loading ||
						!(
							Object.values(form).every((el) => el?.trim().length > 0) &&
							Object.values(errors).every((el) => !el)
						)
					}
				/>

				<View style={styles.createSection}>
					<Text style={styles.infoText}>{t("loginScreen.info")}</Text>

					{/* <CustomPressable
						onPress={() => {
							navigation.navigate(REGISTER);
						}}
					>
						<Text style={styles.linkButton}>Register</Text>
					</CustomPressable> */}
				</View>
			</View>
		</>
	);
};

export default Login;

const styles = StyleSheet.create({
	logo: {
		height: 150,
		width: "100%",
		alignSelf: "center",
		marginTop: 50,
		resizeMode: "contain",
	},
	title: {
		fontSize: 21,
		textAlign: "center",
		paddingTop: 20,
		fontWeight: "500",
	},
	subTitle: {
		fontSize: 17,
		textAlign: "center",
		paddingVertical: 20,
		fontWeight: "500",
	},
	form: {
		padding: 20,
	},
	createSection: {
		flexDirection: "row",
		alignItems: "center",
		marginVertical: 5,
	},
	linkButton: {
		paddingLeft: 17,
		color: colors.primary,
		fontSize: 16,
	},
	infoText: {
		fontSize: 12,
		color: colors.grey,
		justifyContent: "center",
		alignItems: "center",
		// paddingHorizontal: 15,
		paddingVertical: 5,
	},
});
