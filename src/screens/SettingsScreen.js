import { StyleSheet, Text, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import Settings from '../components/Settings/Settings';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SettingsScreen = () => {
  const [URL, setURL] = useState(null);
  const [videoQuality, setVideoQuality] = useState('Low');

  const [modalVisible, setmodalVisible] = useState(false);

  useEffect(() => {
    const getSettings = async () => {
      let url;
      let videoQ;
      try {
        // await AsyncStorage.clear();
        videoQ = await AsyncStorage.getItem('videoQuality');
        url = await AsyncStorage.getItem('URL');
        console.log('videoq,url', videoQ, url);
        if (url !== null) {
          let f = JSON.parse(url);
          f && setURL(f);
        }
        if (videoQ !== null) {
          let s2 = JSON.parse(videoQ);
          s2 && setVideoQuality(s2);
        }
      } catch (error) {
        console.log(error, 'error2');
      }
    };
    getSettings();
  }, []);

  const settingsOptions = [
    {
      title: 'Connections',
      subTitle: 'Name',
      onPress: () => {},
    },
    {
      title: 'URL',
      subTitle: URL,
      onPress: () => {},
    },
    {
      title: 'Sort By',
      subTitle: 'First name',
      onPress: () => {},
    },
    {
      title: 'VideoQuality',
      subTitle: videoQuality,
      onPress: () => {
        setmodalVisible(true);
      },
    },
    {
      title: 'Mode',
      subTitle: 'Name',
      onPress: () => {},
    },
  ];
  const saveSetting = async (key, value) => {
    console.log('key,value', key, value);

    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
      setmodalVisible(false);
    } catch (error) {
      console.log(error, 'error1');
    }
  };

  const VideoQualityPreference = [
    {
      name: 'Low',
      selected: videoQuality === 'Low',
      onPress: () => {
        saveSetting('videoQuality', 'Low');
        setVideoQuality('Low');
      },
    },
    {
      name: 'Medium',
      selected: videoQuality === 'Medium',

      onPress: async () => {
        saveSetting('videoQuality', 'Medium');
        setVideoQuality('Medium');
      },
    },
    {
      name: 'High',
      selected: videoQuality === 'High',

      onPress: () => {
        saveSetting('videoQuality', 'High');
        setVideoQuality('High');
      },
    },
  ];
  return (
    <Settings
      settingsOptions={settingsOptions}
      modalVisible={modalVisible}
      setModalVisible={setmodalVisible}
      VideoQualityPreference={VideoQualityPreference}
    />
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({});
