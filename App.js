import React from 'react';
import Toast, { ErrorToast } from 'react-native-toast-message';
import SplashScreen from 'react-native-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'react-native';

import GlobalProvider from './src/context/reducers/Provider';
import AppNavContainer from './src/navigations';
import './src/constants/DCSLocalize';

const toastConfig = {
  error: (props) => (
    <ErrorToast
      {...props}
      contentContainerStyle={{
        flex: 1,
      }}
      text1NumberOfLines={3}
      text2NumberOfLines={4}
      text1Style={{
        fontSize: 15,
      }}
      text2Style={{
        fontSize: 14,
      }}
    />
  ),
};

export default function App() {
  if (!__DEV__) {
    console.log = () => {};
  }
  React.useEffect(() => {
    SplashScreen.hide();
  }, []);

  return (
    <GlobalProvider>
      <SafeAreaProvider>
        <StatusBar barStyle='dark-content' />

        <AppNavContainer />
        <Toast config={toastConfig} />
      </SafeAreaProvider>
    </GlobalProvider>
  );
}
