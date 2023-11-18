import axios from "axios";
import AppConfig from "./config";

export const scoreBoardHandler = async (data, token, scoreboardURL) => {
	// there are two end points for sending api request

	console.log("data, token, scoreboardURL", data, token, scoreboardURL);
	let url;

	try {
		url = `${AppConfig.BASE_URL_MY}/game/scoreboard?serviceId=${data.streamName}`;
		if (scoreboardURL) {
			url = `${AppConfig.BASE_URL_MY}/game/scoreboard?serviceId=${data.streamName}&scoreboard=true`;
		}

		let res = await axios({
			method: "POST",
			url,

			data,

			headers: {
				Authorization: `Bearer ${token}`,
			},
		});

		// console.log("res", res);
		return res;
	} catch (err) {
		console.log(err, url);
		return err;
	}
};
