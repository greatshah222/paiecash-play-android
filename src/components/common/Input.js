import { StyleSheet, Text, View, TextInput } from 'react-native';
import React, { useState } from 'react';
import Colors from '../../assets/themes/colors';
import colors from '../../assets/themes/colors';

const Input = ({
  onChangeText,
  style,
  value,
  label,
  icon,
  iconPosition,
  error,
  ...props
}) => {
  const [focused, setFocused] = useState(false);
  const getBorderColor = () => {
    if (error) {
      return colors.danger;
    }
    if (focused) {
      return colors.primary;
    } else {
      return colors.grey;
    }
  };

  return (
    <View style={styles.inputContainer}>
      {label && <Text>{label}</Text>}
      <View
        style={[
          styles.wrapper,
          { flexDirection: iconPosition === 'right' ? 'row-reverse' : 'row' },
          { borderColor: getBorderColor() },
        ]}
      >
        <View>{icon && icon}</View>

        <TextInput
          onChangeText={onChangeText}
          value={value}
          style={[styles.textInput, style]}
          onFocus={() => setFocused(true)}
          // when user leaves
          onBlur={() => setFocused(false)}
          {...props}
        />
      </View>

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
};

export default Input;

const styles = StyleSheet.create({
  textInput: {
    flex: 1,
    width: '100%',
  },
  wrapper: {
    height: 42,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 15,
    alignItems: 'center',
    marginTop: 5,
    // justifyContent: 'center',
  },
  inputContainer: {
    paddingVertical: 12,
  },
  error: {
    color: colors.danger,
    paddingTop: 5,
    fontSize: 12,
  },
});
