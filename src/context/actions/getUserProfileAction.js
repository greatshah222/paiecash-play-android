import {
	PROFILE_FAILED,
	PROFILE_LOADING,
	PROFILE_SUCCESS,
	PROFILE_UPDATE_SUCCESS,
} from "../../constants/actionTypes";
import axios from "axios";
import { BASE_URL } from "./registerActions";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAccountToken } from "../../utils/utils";

export const getUserProfile = () => async (dispatch) => {
	dispatch({
		type: PROFILE_LOADING,
	});

	let userToken = await AsyncStorage.getItem("token");
	userToken = JSON.parse(userToken);

	let organizationId = await AsyncStorage.getItem("userOrgId");
	organizationId = JSON.parse(organizationId);

	const url = `${BASE_URL}/api/user?action=getUserProfile&organizationId=${organizationId}&userToken=${userToken}`;
	console.log("url", url, organizationId, userToken);

	try {
		const res = await axios.get(url);
		console.log(`userprofile11: `, res?.data, res?.status);
		if (
			res?.status === 200 ||
			res?.data?.status === 200 ||
			res?.status === "ok" ||
			res?.data?.status === "ok"
		) {
			dispatch({
				type: PROFILE_SUCCESS,
				payload: res?.data,
			});
		} else {
			dispatch({
				type: PROFILE_FAILED,
				payload: { error: "Server Error.Please Try Again" },
			});
		}
	} catch (error) {
		dispatch({
			type: PROFILE_FAILED,
			payload: { error: "Server Error.Please Try Again" },
		});
	}
};

export const updateUserProfile =
	(organizationId = 263559910, profileData, initialuserData) =>
	async (dispatch) => {
		dispatch({
			type: PROFILE_LOADING,
		});
		let {
			EMAIL,
			FIRSTNAME,
			LASTNAME,
			ADDRESS,
			PHONENUMBER,
			COUNTRYID,
			REGIONID,
			CITYNAME,
			POSTALCODE,
		} = profileData;
		let userToken = await AsyncStorage.getItem("token");
		userToken = JSON.parse(userToken);
		let userId = await AsyncStorage.getItem("userId");
		userId = JSON.parse(userId);

		CITYNAME = CITYNAME ? CITYNAME : initialuserData?.city;
		PHONENUMBER = PHONENUMBER ? PHONENUMBER : initialuserData?.phone;
		ADDRESS = ADDRESS ? ADDRESS : initialuserData?.address;
		COUNTRYID = COUNTRYID ? COUNTRYID : initialuserData?.countryId;
		REGIONID = REGIONID ? REGIONID : initialuserData?.regionId;
		POSTALCODE = POSTALCODE ? POSTALCODE : initialuserData?.postalCode;
		const token = createAccountToken(
			userId,
			organizationId,
			"SgtKzUCp29",
			FIRSTNAME,
			LASTNAME,

			PHONENUMBER,
			COUNTRYID,
			REGIONID,
			CITYNAME,
			POSTALCODE
		);

		console.log("token", token);

		let res;
		try {
			const url = `${BASE_URL}/api/user?action=updateUser&organizationId=${organizationId}&userToken=${userToken}&firstName=${FIRSTNAME}&lastName=${LASTNAME}&emailAddress=${EMAIL}&countryId=${COUNTRYID}&regionId=${REGIONID}&postalCode=${POSTALCODE}&cityName=${CITYNAME}&phoneNumber=${PHONENUMBER}&token=${token}`;
			let updatedItem = [];
			updatedItem.email = profileData.EMAIL;
			updatedItem.firstName = profileData.FIRSTNAME;
			updatedItem.lastName = profileData.LASTNAME;
			updatedItem.address = profileData.ADDRESS;
			console.log(profileData, "updatedItem", updatedItem);

			res = await axios.get(url);
			console.log(res?.data);

			if (res?.status === "ok" || res?.data?.status === "ok") {
				console.log(`userprofile11Update: `, res?.status);

				dispatch({
					type: PROFILE_UPDATE_SUCCESS,
					payload: updatedItem,
				});
				console.log("ifblock");
			} else {
				dispatch({
					type: PROFILE_FAILED,
					payload: { error: "Server Error.Please Try Again" },
				});
				console.log("errorblock1", res?.data);
			}
		} catch (error) {
			console.log("errorblock2", res, error);

			dispatch({
				type: PROFILE_FAILED,
				payload: { error: "Server Error.Please Try Again" },
			});
		}
	};
