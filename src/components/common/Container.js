import {StyleSheet, Text, View, ScrollView} from 'react-native';
import React from 'react';

const Container = ({children, style}) => {
  return (
    <ScrollView>
      <View style={[styles.wrapper, style]}>{children}</View>
    </ScrollView>
  );
};

export default Container;

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    padding: 20,
  },
});
