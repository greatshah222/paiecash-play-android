import axios from "axios";
import {
	REGISTER_FAILED,
	REGISTER_LOADING,
	REGISTER_SUCCESS,
	CLEAR_AUTH_STATE,
} from "../../constants/actionTypes";

export const BASE_URL = "https://my.icareus.com";

export const clearAuthState = () => (dispatch) => {
	dispatch({
		type: CLEAR_AUTH_STATE,
	});
};
export default (inputs, organizationId = 263559910) =>
	(dispatch) =>
	async (onSuccess) => {
		dispatch({
			type: REGISTER_LOADING,
		});
		let registerResponse;
		try {
			registerResponse = await axios.get(`${BASE_URL}/api/register?action=addSubscriber`, {
				params: {
					organizationId,
					emailAddress: inputs?.EMAIL,
					userPassword: inputs?.PASSWORD,
					...(inputs?.PHONE ? { phoneNumber: inputs?.PHONE } : {}),
					...(inputs?.CITY ? { cityName: inputs?.CITY } : {}),
					...(inputs?.DATEOFBIRTH ? { dateOfBirth: inputs?.DATEOFBIRTH } : {}),
					...(inputs?.COUNTRY
						? {
								countryId: countries.find((country) => country.name === inputs?.COUNTRY).id,
						  }
						: {}),
					...(inputs?.FIRSTNAME ? { firstName: inputs?.FIRSTNAME } : {}),
					...(inputs?.LASTNAME ? { lastName: inputs?.LASTNAME } : {}),
					...(inputs?.ADDRESS ? { address1: inputs?.ADDRESS } : {}),
				},
			});

			console.log("Register: ", registerResponse?.data, registerResponse?.data?.message, "message");
			if (registerResponse?.data?.status === "ok") {
				dispatch({
					type: REGISTER_SUCCESS,
					payload: registerResponse?.data,
				});
				onSuccess(registerResponse?.data);
			} else {
				dispatch({
					type: REGISTER_FAILED,
					payload: registerResponse?.data
						? { error: registerResponse?.data?.message }
						: { error: "Something Went Wrong" },
				});
			}
		} catch (err) {
			dispatch({
				type: REGISTER_FAILED,
				payload: err?.respons?.data ? err?.response?.data : { error: "Something Went Wrong" },
			});
		}
	};

// const AuthActions =
//   ({email, password, fname: first_name, lname: last_name, username}) =>
//   async dispatch => {
//     dispatch({
//       type: REGISTER_LOADING,
//     });

//     try {
//       const res = await axiosInstance.post('/auth/register', {
//         email,
//         password,
//         username,
//         last_name,
//         first_name,
//       });
//       dispatch({
//         type: REGISTER_SUCCESS,
//         payload: res?.data,
//       });
//     } catch (err) {
//       console.log(err, 'errresponse');

//       dispatch({
//         type: REGISTER_FAILED,
//         payload: err?.response?.data
//           ? err?.response?.data
//           : {error: 'Something Went Wrong'},
//       });
//     }
//   };

// export default AuthActions;
