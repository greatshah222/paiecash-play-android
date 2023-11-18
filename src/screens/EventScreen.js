import {
	StyleSheet,
	Text,
	View,
	Pressable,
	FlatList,
	RefreshControl,
	NativeModules,
} from "react-native";
import React from "react";
import Container from "../components/common/Container";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import Icon from "../components/common/Icon";
import Event, { ListEmptyComponent } from "../components/Event/Event";
import { GlobalContext } from "../context/reducers/Provider";
import getLiveEventsAction from "../context/actions/getLiveEventsAction";
import getUpcomingEventsAction from "../context/actions/getUpcomingEventsAction";

const EventScreen = () => {
	const { t } = useTranslation();

	const { setOptions, toggleDrawer } = useNavigation();

	const [modalVisible, setModalVisible] = React.useState(false);
	const [refreshing, setRefreshing] = React.useState(false);

	const {
		eventState: { getUpcomingEvents, getLiveEvents },
		eventDispatch,
		user,
	} = React.useContext(GlobalContext);

	React.useLayoutEffect(() => {
		setOptions({
			headerLeft: () => (
				<Pressable onPress={() => toggleDrawer()}>
					<Icon name="menu" type="material" size={25} style={styles.icomenu} />
				</Pressable>
			),
		});
	}, []);

	React.useEffect(() => {
		if (user && user?.userOrganizationId) {
			getLiveEventsAction(user?.userOrganizationId)(eventDispatch);
			getUpcomingEventsAction(user?.userOrganizationId)(eventDispatch);
		}
	}, [user, user?.userOrganizationId]);

	const onRefresh = () => {
		setRefreshing(true);

		setTimeout(() => {
			getLiveEventsAction(user?.userOrganizationId)(eventDispatch);
			getUpcomingEventsAction(user?.userOrganizationId)(eventDispatch);
			setRefreshing(false);
		}, 100);
	};

	return (
		<View style={{ flex: 1 }}>
			<FlatList
				ListHeaderComponent={
					<Event
						data={getLiveEvents?.data}
						loading={getLiveEvents?.loading}
						title={t("eventScreen.liveGames")}
						modalVisible={modalVisible}
						setModalVisible={setModalVisible}
						subTitle={t("eventScreen.liveSubTitle")}
					/>
				}
				ListFooterComponent={
					<Event
						data={getUpcomingEvents?.data}
						loading={getUpcomingEvents?.loading}
						title={t("eventScreen.upcomingGames")}
						modalVisible={modalVisible}
						setModalVisible={setModalVisible}
						subTitle={t("eventScreen.subTitle")}
					/>
				}
				refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
			/>
		</View>
	);
};

export default EventScreen;

const styles = StyleSheet.create({
	icomenu: {
		padding: 10,
	},
});
