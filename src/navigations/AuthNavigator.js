import {StyleSheet, Text, View} from 'react-native';
import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {LOGIN, REGISTER} from '../constants/routeNames';
import SignupScreen from '../screens/SignupScreen';
import LoginScreen from '../screens/LoginScreen';

const AuthNavigator = () => {
  const AuthStack = createStackNavigator();
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <AuthStack.Screen name={LOGIN} component={LoginScreen} />
      <AuthStack.Screen name={REGISTER} component={SignupScreen} />
    </AuthStack.Navigator>
  );
};

export default AuthNavigator;

const styles = StyleSheet.create({});
