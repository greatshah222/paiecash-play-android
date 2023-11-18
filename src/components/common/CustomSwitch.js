import React from "react";
import { StyleSheet, Switch, Text } from "react-native";
import { material, systemWeights } from "react-native-typography";

import colors from "../../assets/themes/colors";

const CustomSwitch = ({ value, onChange, id, label }) => {
	return (
		<>
			<Text style={styles.text}>{label}</Text>

			<Switch
				trackColor={{ false: colors.grey, true: colors.grey }}
				thumbColor={value ? colors.green : colors.danger}
				ios_backgroundColor="#3e3e3e"
				onValueChange={onChange}
				value={value}
				id={id}
			/>
		</>
	);
};

export default CustomSwitch;

const styles = StyleSheet.create({
	text: {
		...material.subheading,
		...systemWeights.semibold,

		color: colors.black,
		flex: 1,
	},
});
