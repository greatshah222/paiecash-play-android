import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { LOGOUT_USER } from "../../constants/actionTypes";

export const BASE_URL = "https://my.icareus.com";

export default () => async (dispatch) => {
	const removeCookie = async () => {
		try {
			await AsyncStorage.removeItem("token");
			await AsyncStorage.removeItem("userId");
			await AsyncStorage.removeItem("userOrgId");
		} catch (error) {
			console.log(error);
		}
	};
	removeCookie();

	dispatch({
		type: LOGOUT_USER,
	});
};
