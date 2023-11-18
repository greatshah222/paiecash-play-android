import { StyleSheet, Text, View, SafeAreaView } from 'react-native';
import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import HomeNavigator from './HomeNavigator';
import { HOME_NAVIGATOR } from '../constants/routeNames';
import Container from '../components/common/Container';
import SideMenu from './SideMenu';
import { GlobalContext } from '../context/reducers/Provider';

const getDrawerContent = (navigation, authDispatch) => {
  return <SideMenu navigation={navigation} authDispatch={authDispatch} />;
};

const DrawerNavigator = () => {
  console.log('draw');
  const { authDispatch } = React.useContext(GlobalContext);
  const DrawerStack = createDrawerNavigator();
  return (
    <DrawerStack.Navigator
      // we will get all side drawer constent froom drawerContent funstion. we are also passing auth dispatch
      drawerContent={({ navigation }) =>
        getDrawerContent(navigation, authDispatch)
      }
      screenOptions={{
        headerShown: false,
      }}
    >
      <DrawerStack.Screen name={HOME_NAVIGATOR} component={HomeNavigator} />
    </DrawerStack.Navigator>
  );
};

export default DrawerNavigator;

const styles = StyleSheet.create({});
