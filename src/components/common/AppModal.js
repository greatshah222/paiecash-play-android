import { StyleSheet, Text, View, Modal, Pressable, ScrollView } from "react-native";
import React from "react";
import Icon from "./Icon";
import colors from "../../assets/themes/colors";
import PropTypes from "prop-types";

const AppModal = ({
	modalVisible,
	setModalVisible,
	title,
	modalBody,
	modalFooter,
	closeOnTouchOutside,
}) => {
	return (
		<Modal visible={modalVisible} transparent>
			<Pressable
				style={styles.pressable}
				onPress={() => {
					if (closeOnTouchOutside) {
						setModalVisible(false);
					}
				}}
			>
				<View style={styles.modalView}>
					<ScrollView>
						<View style={styles.header}>
							<Icon name="close" type="evil" size={21} onPress={() => setModalVisible(false)} />
							<Text style={styles.headerTitle}>{title || "PaieCash Play"}</Text>
							<View />
						</View>
						<View style={styles.footerSeparator} />

						<View style={styles.body}>{modalBody}</View>
						{modalFooter ? (
							<>
								<View style={styles.footerSeparator} />

								<View>{modalFooter}</View>
							</>
						) : (
							<View>
								<View style={styles.footerSeparator} />
								<View style={styles.footerItems}>
									<View style={styles.footer}>
										<Text style={styles.footerText}>Privacy Policy</Text>
										<View style={styles.termsView} />
										<Text style={styles.footerText}>Terms of Service</Text>
									</View>
								</View>
							</View>
						)}
					</ScrollView>
				</View>
			</Pressable>
		</Modal>
	);
};
// this is not required
AppModal.prototype = {
	closeOnTouchOutside: PropTypes.bool,
};
// so we are passing default values but any component does not want close on outside they can pass from their components
AppModal.default = {
	closeOnTouchOutside: true,
};

export default AppModal;

const styles = StyleSheet.create({
	pressable: {
		backgroundColor: "rgba(0,0,0,0.6)",
		flex: 1,
		justifyContent: "center",
	},
	modalView: {
		backgroundColor: "white",
		minHeight: 300,
		marginHorizontal: 20,
		borderRadius: 4,
	},
	header: {
		flexDirection: "row-reverse",
		padding: 15,
		alignItems: "center",
		width: "100%",
		justifyContent: "space-between",
	},
	headerTitle: { fontSize: 21, flex: 1, fontWeight: "500" },
	body: {
		minHeight: 300,
		paddingHorizontal: 20,
		paddingVertical: 10,
	},
	footer: {
		justifyContent: "space-evenly",
		paddingVertical: 7,
		alignItems: "center",
		flexDirection: "row",
	},

	termsView: {
		width: 5,
		height: 5,
		borderRadius: 100,
		backgroundColor: colors.grey,
	},

	footerSeparator: {
		height: 0.5,
		backgroundColor: colors.grey,
	},

	footerItems: {
		width: "100%",
		padding: 10,
	},

	footerText: {
		fontSize: 12,
	},
});
