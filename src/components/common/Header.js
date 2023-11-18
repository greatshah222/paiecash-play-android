import { StyleSheet, Text, View } from 'react-native';
import React from 'react';
import colors from '../../assets/themes/colors';

const Header = ({ title, subTitle }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{title}</Text>
      <Text style={styles.subText}>{subTitle}</Text>
    </View>
  );
};

export default Header;

const styles = StyleSheet.create({
  container: {
    // flexDirection: 'row',
    // alignItems: 'center',
    justifyContent: 'space-between',
  },
  text: {
    fontSize: 22,
    color: colors.primary,
    padding: 15,
  },
  subText: {
    fontSize: 12,
    color: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 5,
  },
});
