import {
	LIVE_EVENTS_FAILED,
	LIVE_EVENTS_LOADING,
	LIVE_EVENTS_SUCCESS,
} from "../../constants/actionTypes";
import axios from "axios";
import { BASE_URL } from "./registerActions";

export default (organizationId, limit) => async (dispatch) => {
	dispatch({
		type: LIVE_EVENTS_LOADING,
	});
	try {
		let url = `${BASE_URL}/api/games?action=search&version=02&organizationId=${organizationId}&ongoing=true`;

		const res = await axios.get(url);

		console.log("res?.data", res?.data);
		if (res?.data?.status === "ok") {
			dispatch({
				type: LIVE_EVENTS_SUCCESS,
				payload: res?.data?.games,
			});
		} else {
			dispatch({
				type: LIVE_EVENTS_FAILED,
				payload: { error: "Server Error.Please Try Again" },
			});
		}
	} catch (error) {
		dispatch({
			type: LIVE_EVENTS_FAILED,
			payload: { error: "Server Error.Please Try Again" },
		});
	}
};
