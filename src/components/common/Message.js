import {StyleSheet, Text, View, Pressable} from 'react-native';
import React from 'react';
import colors from '../../assets/themes/colors';

const Message = ({
  message,
  onPress,
  primary,
  danger,
  info,
  success,
  retry,
  retryFn,
  onDismiss,
}) => {
  const [userDismissed, setUserDismissed] = React.useState(false);

  React.useEffect(() => {
    setUserDismissed(false);
  }, []);

  const getBackgroundColor = () => {
    if (primary) {
      return colors.primary;
    } else if (info) {
      return colors.secondary;
    } else if (danger) {
      return colors.danger;
    } else if (success) {
      return colors.success;
    }
  };
  return userDismissed ? null : (
    <Pressable
      style={({pressed}) => [
        styles.container,

        {backgroundColor: getBackgroundColor()},
      ]}
      onPress={onPress}>
      <View style={styles.messageContainer}>
        <Text
          style={{
            color: colors.white,
          }}>
          {message}
        </Text>
        {/* We will only show retry or x icon at a time */}
        {retry && !typeof onDismiss === 'function' && (
          <Pressable
            onPress={retryFn}
            style={({pressed}) => pressed && styles.pressed}>
            <Text style={styles.icon}>Retry</Text>
          </Pressable>
        )}

        {typeof onDismiss === 'function' && (
          <Pressable
            onPress={() => {
              setUserDismissed(true);
              onDismiss();
            }}
            style={({pressed}) => pressed && styles.pressed}>
            <Text style={styles.icon}>X</Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
};

export default Message;

const styles = StyleSheet.create({
  pressed: {opacity: 0.7},
  container: {
    height: 42,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 5,
    borderRadius: 4,
    flex: 1,
  },

  loading: {
    flexDirection: 'row',
  },
  messageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
    // backgroundColor: 'white',
    width: '100%',
  },
  icon: {
    color: colors.white,
  },
});
