import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import React from 'react';
import colors from '../../assets/themes/colors';
import Icon from './Icon';

const CustomButton = ({
  title,
  onPress,
  disabled,
  loading,
  secondary,
  primary,
  danger,
  icon,
  style,
}) => {
  const getBackgroundColor = () => {
    if (disabled) {
      return colors.grey;
    }
    if (primary) {
      return colors.primary;
    } else if (secondary) {
      return colors.secondary;
    } else if (danger) {
      return colors.danger;
    }
  };
  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
        { backgroundColor: getBackgroundColor() },
        style,
      ]}
      disabled={disabled}
      onPress={onPress}
    >
      <View style={styles.buttonContainer}>
        {loading && (
          <ActivityIndicator color={primary ? colors.white : colors.primary} />
        )}
        <View style={icon && styles.buttonContainer2}>
          {icon && (
            <Icon
              name={icon?.iconName}
              type={icon?.iconType}
              size={icon?.iconSize}
              color={icon?.iconColor}
            />
          )}
          <Text
            style={[
              {
                color: disabled ? 'black' : colors.white,
                paddingLeft: loading ? 5 : 0,
              },
              icon && styles.iconText,
            ]}
          >
            {title}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

export default CustomButton;

const styles = StyleSheet.create({
  pressed: { opacity: 0.7 },
  container: {
    height: 42,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 5,
    borderRadius: 4,
  },

  loading: {
    flexDirection: 'row',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer2: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    marginLeft: 5,
  },
});
