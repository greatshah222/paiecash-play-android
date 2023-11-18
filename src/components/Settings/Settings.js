import { ScrollView, Text, View } from 'react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';

import CustomPressable from '../common/CustomPressable';
import colors from '../../assets/themes/colors';
import AppModal from '../common/AppModal';
import Icon from '../common/Icon';

const Settings = ({
  settingsOptions,
  setModalVisible,
  modalVisible,
  VideoQualityPreference,
}) => {
  const { t } = useTranslation();

  return (
    <>
      <AppModal
        modalVisible={modalVisible}
        modalFooter={<></>}
        closeOnTouchOutside={false}
        modalBody={
          <View>
            {VideoQualityPreference.map(({ name, selected, onPress }) => (
              <View key={name}>
                <CustomPressable
                  onPress={onPress}
                  style={{ flexDirection: 'row', alignItems: 'center' }}
                >
                  {selected && <Icon name='check' type='material' size={17} />}
                  <Text
                    style={{
                      fontSize: 17,
                      paddingLeft: selected ? 15 : 30,
                      marginVertical: 10,
                    }}
                  >
                    {name}
                  </Text>
                </CustomPressable>
              </View>
            ))}
          </View>
        }
        title={t('settingsScreen.select')}
        setModalVisible={setModalVisible}
      />

      <ScrollView style={{ backgroundColor: colors.white }}>
        {settingsOptions.map(({ title, subTitle, onPress }) => (
          <CustomPressable onPress={onPress} key={title}>
            <View style={{ paddingHorizontal: 20, paddingVertical: 20 }}>
              <Text style={{ fontSize: 17 }}>{title}</Text>
              {subTitle && (
                <Text style={{ opacity: 0.6, paddingTop: 5 }}>{subTitle}</Text>
              )}
            </View>
            <View style={{ height: 0.5, backgroundColor: colors.grey }} />
          </CustomPressable>
        ))}
      </ScrollView>
    </>
  );
};

export default Settings;
