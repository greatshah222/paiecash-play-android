import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

import { LOGIN_FAILED, LOGIN_LOADING, LOGIN_SUCCESS } from "../../constants/actionTypes";
import { BASE_URL } from "./registerActions";

export default (inputs, organizationId = 263559910) =>
	async (dispatch) => {
		dispatch({
			type: LOGIN_LOADING,
		});
		const { EMAIL, PASSWORD } = inputs;
		let res;
		try {
			let url = `${BASE_URL}/api/login?action=authenticate`;
			res = await axios.get(url, {
				params: {
					organizationId,
					eMail: EMAIL,
					password: PASSWORD,
					role: "ismaccount administrator",
				},
			});

			console.log("res", res);

			if (res?.data?.status === "ok") {
				// set userid and token in async storage
				AsyncStorage.setItem("userId", JSON.stringify(res?.data.user_id));
				// need to stringify to save string
				AsyncStorage.setItem("token", JSON.stringify(res?.data.user_token));

				AsyncStorage.setItem("userOrgId", JSON.stringify(res?.data?.user_organization_id));

				dispatch({
					type: LOGIN_SUCCESS,
					payload: res?.data,
				});
			} else {
				dispatch({
					type: LOGIN_FAILED,
					payload: res?.data ? { error: res?.data?.message } : { error: "Something Went Wrong" },
				});
			}
		} catch (err) {
			console.log(err);

			dispatch({
				type: LOGIN_FAILED,
				payload: res?.data ? { error: res?.data?.message } : { error: "Something Went Wrong" },
			});
		}
	};
