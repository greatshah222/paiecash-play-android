import {
  StyleSheet,
  Text,
  View,
  Image,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import CountryPicker from 'react-native-country-picker-modal';

import Input from '../common/Input';
import CustomButton from '../common/CustomButton';
import CustomPressable from '../common/CustomPressable';

import { LOGIN, REGISTER } from '../../constants/routeNames';
import colors from '../../assets/themes/colors';
import Message from '../common/Message';

import { DEFAULT_IMAGE_URI } from '../../constants/general';
import Container from '../common/Container';
// import ImagePicker from '../common/ImagePicker';

const Profile = ({
  onSubmit,
  onChange,
  form,
  errors,
  error,
  loading,
  sheetRef,
  openSheet,
  closeSheet,
  onFileSelected,
}) => {
  const navigation = useNavigation();
  const { t } = useTranslation();

  console.log('errorSignup', error?.error, loading, errors);
  console.log(
    Object.values(form).every((el) => el.trim().length > 0) &&
      Object.values(errors).every((el) => !el),
    'ermsg'
  );
  console.log('form', form);
  return (
    <>
      <View style={styles.form}>
        {error?.error && (
          <Message danger message={error?.error} onDismiss={() => {}} />
        )}
        {loading && <ActivityIndicator color={colors.primary} />}

        {/* <Image source={{ uri: DEFAULT_IMAGE_URI }} style={styles.imageView} />
          <CustomPressable onPress={openSheet}>
            <Text style={styles.chooseText}>Choose Image</Text>
          </CustomPressable> */}

        <Input
          label={t('signup.firstName')}
          placeholder={t('signup.firstNamePlaceHolder')}
          onChangeText={(value) => {
            onChange({ name: 'FIRSTNAME', value });
          }}
          /// actually error?.first_name should come from server but our server doesnot support it
          error={errors.FIRSTNAME || error?.first_name?.[0]}
          value={form?.FIRSTNAME || ''}
          // we are disbaling to edit
          editable={false}
          selectTextOnFocus={false}
        />

        <Input
          label={t('signup.lastName')}
          placeholder={t('signup.lastNamePlaceHolder')}
          onChangeText={(value) => {
            onChange({ name: 'LASTNAME', value });
          }}
          error={errors.LASTNAME || error?.last_name?.[0]}
          value={form?.LASTNAME || ''}
          editable={false}
          selectTextOnFocus={false}
        />
        <Input
          label={t('signup.email')}
          placeholder={t('signup.emailPlaceHolder')}
          onChangeText={(value) => {
            onChange({ name: 'EMAIL', value });
          }}
          error={errors.EMAIL || error?.email?.[0]}
          value={form?.EMAIL || ''}
          editable={false}
          selectTextOnFocus={false}
        />

        <Input
          label={t('signup.address')}
          placeholder={t('signup.addressPlaceHolder')}
          onChangeText={(value) => {
            onChange({ name: 'ADDRESS', value });
          }}
          error={errors.ADDRESS || error?.address?.[0]}
          value={form?.ADDRESS || ''}
          editable={false}
          selectTextOnFocus={false}
        />
        {/* <Input
          label={'Country'}
          placeholder="Enter Country"
          onChangeText={value => {
            onChange({name: 'COUNTRY', value});
          }}
          icon={
            <CountryPicker
              withFilter
              withFlag
              withCountryNameButton={false}
              // withCallingCode={true}
              withEmoji
              onSelect={E => {
                console.log(E);
              }}
            />
          }
          style={{paddingLeft: 10}}
          iconPosition="left"
          error={errors.COUNTRY}
          value={''}
        /> */}

        {/* <CustomButton
          title={'Save'}
          onPress={onSubmit}
          primary
          loading={loading}
          disabled={
            loading ||
            !(
              Object.values(form).every((el) => el.trim().length > 0) &&
              Object.values(errors).every((el) => !el)
            )
          }
        /> */}
      </View>
      {/* <ImagePicker ref={sheetRef} onFileSelected={onFileSelected} /> */}
    </>
  );
};

export default Profile;

const styles = StyleSheet.create({
  title: {
    fontSize: 21,
    textAlign: 'center',
    paddingTop: 20,
    fontWeight: '500',
  },
  subTitle: {
    fontSize: 17,
    textAlign: 'center',
    paddingVertical: 20,
    fontWeight: '500',
  },
  form: {
    padding: 20,
  },
  imageView: {
    width: 150,
    height: 150,
    borderRadius: 75,
    alignSelf: 'center',
  },
  chooseText: {
    color: colors.primary,
    textAlign: 'center',
  },
});
