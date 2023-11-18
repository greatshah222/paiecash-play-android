import {
	SINGLE_EVENT_FAILED,
	SINGLE_EVENT_LOADING,
	SINGLE_EVENT_SUCCESS,
} from "../../constants/actionTypes";
import axios from "axios";
import { BASE_URL } from "./registerActions";
import axiosInstance from "../../helpers/axiosInterceptor";

export default (organizationId, eventId, token) => async (dispatch) => {
	dispatch({
		type: SINGLE_EVENT_LOADING,
	});
	let res;

	let url = `/api/game?organizationId=${organizationId}&gameId=${eventId * 1 + 1}`;

	axiosInstance
		.get(url)
		.then((res1) => {
			console.log("res1axi", res1);
			dispatch({
				type: SINGLE_EVENT_SUCCESS,
				payload: res1?.data,
			});
		})
		.catch((err) => {
			console.log(err, "err1");
			dispatch({
				type: SINGLE_EVENT_FAILED,
				payload: { error: "Server Error.Please Try Again" },
			});
		});
};
