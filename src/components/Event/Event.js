import {
	StyleSheet,
	Text,
	View,
	FlatList,
	Pressable,
	Image,
	ActivityIndicator,
} from "react-native";
import React from "react";
import Message from "../common/Message";
import colors from "../../assets/themes/colors";
import EventItem from "./EventItem";
import Header from "../common/Header";
import { useNavigation } from "@react-navigation/native";

import { connections } from "../Larix/Connections";
import { CAMERA } from "../../constants/routeNames";

export const ListEmptyComponent = () => {
	return (
		<View style={styles.listEmptyComponent}>
			<Image
				source={require("../../assets/images/defaultImage/noevents_icon.png")}
				style={styles.noEventImage}
			/>
		</View>
	);
};

const Event = ({ modalVisible, setModalVisible, data, title, loading, subTitle }) => {
	const { navigate } = useNavigation();

	const startStreamingHandler = async (el) => {
		console.log("element111", el);
		let stream1 = {
			active: true,
			connectMode: "c",

			latency: "1000",
			maxbw: "0",
			mode: "av",
			name: `${el?.name[el?.defaultLanguage]}`,
			pass: "",
			passphrase: "",
			pbkeylen: "16",
			ristProfile: "m",
			streamId: "",
			target: "",
			// url should be dynamic
			// url: `rtmp://63.32.222.1:1935/suitelive/${el?.event?.publishingInfo?.serviceId}`,
			url: `${el?.event?.publishingInfo?.ingestUrl}/${el?.event?.publishingInfo?.serviceId}`,
			user: "",
		};

		await connections.deleteAll();

		await connections.add(stream1);

		navigate(CAMERA, {
			event: el,
		});
	};

	return (
		<>
			{loading ? (
				<View style={styles.listEmptyComponent}>
					<ActivityIndicator size={"large"} color={colors.primary} />
				</View>
			) : (
				<View>
					<Header title={title} subTitle={subTitle} />
					<View>
						<FlatList
							data={data}
							ListEmptyComponent={ListEmptyComponent}
							renderItem={({ item }) => (
								<EventItem item={item} title={title} onPress={(el) => startStreamingHandler(el)} />
							)}
							keyExtractor={(item) => String(item?.eventId)}
							// there will be space after last element
							ListFooterComponent={<View style={{ height: 50 }}></View>}
						/>
					</View>
				</View>
			)}
		</>
	);
};

export default Event;

const styles = StyleSheet.create({
	customModalFooter: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginHorizontal: 20,
		marginVertical: 15,
	},
	listEmptyComponent: {
		width: "100%",
		height: 300,
	},
	noEventImage: {
		height: "100%",
		width: "100%",
		maxWidth: 500,
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
		alignSelf: "center",
	},
});
