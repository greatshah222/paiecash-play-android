import React from "react";
import { useTranslation } from "react-i18next";
import * as EmailValidator from "email-validator";
import { useRoute } from "@react-navigation/native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import Container from "../components/common/Container";
import Login from "../components/Login/Login";
import { GlobalContext } from "../context/reducers/Provider";
import loginAction from "../context/actions/loginAction";
import { Platform } from "react-native";

const LoginScreen = () => {
	const { t } = useTranslation();

	const [form, setForm] = React.useState({});
	const [errors, setErrors] = React.useState({});

	const [justSignedUp, setjustSignedUp] = React.useState(false);

	const {
		authDispatch,
		authState: { error, loading, isLoggedIn },
	} = React.useContext(GlobalContext);
	const { params } = useRoute();

	React.useEffect(() => {
		if (params?.data) {
			setjustSignedUp(true);
			setForm({ ...form, EMAIL: params.data.EMAIL });
		}
	}, [params]);

	const onChange = ({ name, value }) => {
		setjustSignedUp(false);

		setForm({ ...form, [name]: value });

		if (value !== "") {
			// if not empty
			if (name === "PASSWORD") {
				if (value.length < 1) {
					return setErrors({
						...errors,
						[name]: t("loginScreen.passwordInvalidError"),
					});
				} else {
					return setErrors({ ...errors, [name]: null });
				}
			} else if (name === "EMAIL") {
				if (!EmailValidator.validate(value.trim())) {
					return setErrors({
						...errors,
						[name]: t("loginScreen.emailInvalidError"),
					});
				} else {
					return setErrors({ ...errors, [name]: null });
				}
			} else {
				return setErrors({ ...errors, [name]: null });
			}
		} else {
			setErrors({ ...errors, [name]: t("loginScreen.requiredError") });
		}
	};
	const onSubmit = () => {
		if (!form.EMAIL) {
			setErrors((prev) => {
				return { ...prev, EMAIL: t("loginScreen.emailError") };
			});
		}
		if (!form.PASSWORD) {
			setErrors((prev) => {
				return { ...prev, PASSWORD: t("loginScreen.passwordError") };
			});
		}

		if (
			Object.values(form).every((el) => el?.trim().length > 0) &&
			Object.values(errors).every((el) => !el)
		) {
			// WE ARE CALLING ACTION->AUTHACTIONS WHICH WILL CALL REDUCER AND THEN REDUCER WILL UPDATE THE STORE
			loginAction(form)(authDispatch);
		}
	};

	return (
		<Container>
			<KeyboardAwareScrollView
				extraHeight={150}
				enableOnAndroid={true}
				enableAutomaticScroll={Platform.OS === "ios"}
				extraScrollHeight={130}
			>
				<Login
					form={form}
					errors={errors}
					onChange={onChange}
					onSubmit={onSubmit}
					error={error}
					loading={loading || isLoggedIn}
					justSignedUp={justSignedUp}
				/>
			</KeyboardAwareScrollView>
		</Container>
	);
};

export default LoginScreen;
