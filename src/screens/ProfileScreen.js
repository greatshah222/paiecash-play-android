import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useRef } from "react";
import * as EmailValidator from "email-validator";
import { useNavigation } from "@react-navigation/native";

import Container from "../components/common/Container";
import Signup from "../components/SignUp/Signup";

// import envs from '../config/env';
import registerActions, { clearAuthState } from "../context/actions/registerActions";
import { GlobalContext } from "../context/reducers/Provider";

import { LOGIN } from "../constants/routeNames";
import Profile from "../components/Profile/Profile";
import { getUserProfile, updateUserProfile } from "../context/actions/getUserProfileAction";

const ProfileScreen = () => {
	const { navigate } = useNavigation();
	const { t } = useTranslation();

	const sheetRef = useRef(null);
	const [form, setForm] = React.useState({
		// EMAIL: 'inbiubn',
	});
	const [errors, setErrors] = useState({});

	const {
		profileDispatch,
		profileState: { error, loading, data },
	} = React.useContext(GlobalContext);

	const closeSheet = () => {
		if (sheetRef.current) {
			sheetRef.current.close();
		}
	};

	const openSheet = () => {
		if (sheetRef.current) {
			sheetRef.current.open();
		}
	};

	const onChange = ({ name, value }) => {
		setForm({ ...form, [name]: value });

		if (value !== "") {
			if (name === "EMAIL") {
				if (!EmailValidator.validate(value)) {
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

	React.useEffect(() => {
		getUserProfile()(profileDispatch);
	}, []);
	React.useEffect(() => {
		if (data?.emailAddress) {
			const {
				address: ADDRESS,
				city: CITY,
				country: COUNTRY,
				countryId,
				emailAddress: EMAIL,
				firstName: FIRSTNAME,
				lastName: LASTNAME,
				phone: PHONE,
				postalCode: POSTALCODE,
				regionId: REGIONID,
			} = data;
			setForm({ ...form, EMAIL, ADDRESS, LASTNAME, FIRSTNAME });
		}
	}, [data?.emailAddress]);

	const onSubmit = () => {
		if (!form.ADDRESS) {
			setErrors((prev) => {
				return { ...prev, ADDRESS: t("profileScreen.addressError") };
			});
		}
		if (!form.FIRSTNAME) {
			setErrors((prev) => {
				return { ...prev, FIRSTNAME: t("profileScreen.firstNameError") };
			});
		}
		if (!form.LASTNAME) {
			setErrors((prev) => {
				return { ...prev, LASTNAME: t("profileScreen.lastNameError") };
			});
		}
		if (!form.EMAIL) {
			setErrors((prev) => {
				return { ...prev, EMAIL: t("profileScreen.emailError") };
			});
		}

		if (
			Object.values(form).every((el) => el.trim().length > 0) &&
			Object.values(errors).every((el) => !el)
		) {
			updateUserProfile(263559910, form, data)(profileDispatch);
		}
	};
	const onFileSelected = (image) => {
		console.log("image", image);
		closeSheet();
	};
	return (
		<Container>
			{data?.emailAddress && (
				<Profile
					form={form}
					errors={errors}
					onChange={onChange}
					onSubmit={onSubmit}
					error={error}
					loading={loading}
					sheetRef={sheetRef}
					closeSheet={closeSheet}
					openSheet={openSheet}
					onFileSelected={onFileSelected}
				/>
			)}
		</Container>
	);
};

export default ProfileScreen;
