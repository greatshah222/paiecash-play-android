import { StyleSheet, Text, View, Pressable } from "react-native";
import React from "react";

const CustomPressable = ({ children, style, onPress, disabled }) => {
	return (
		<Pressable
			onPress={onPress}
			style={({ pressed }) => [(pressed || disabled) && styles.pressed, style]}
			disabled={disabled}
		>
			{children}
		</Pressable>
	);
};

export default CustomPressable;

const styles = StyleSheet.create({
	pressed: {
		opacity: 0.5,
	},
});
