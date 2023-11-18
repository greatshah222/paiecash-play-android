import { StyleSheet, Text, View, Image, Pressable } from 'react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';

import Input from '../common/Input';
import CustomButton from '../common/CustomButton';
import CustomPressable from '../common/CustomPressable';
import { useNavigation } from '@react-navigation/native';
import { LOGIN, REGISTER } from '../../constants/routeNames';
import colors from '../../assets/themes/colors';
import Message from '../common/Message';

const Signup = ({ onSubmit, onChange, form, errors, error, loading }) => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [isSecureEntry, setIsSecureEntry] = React.useState(true);

  return (
    <>
      <Image
        source={require('../../assets/images/logo.png')}
        style={styles.logo}
      />
      <View style={styles.form}>
        <Text style={styles.title}>{t('signup.welcome')}</Text>
        <Text style={styles.subTitle}>{t('signup.createFreeAccount')}</Text>
        {error?.error && (
          <Message danger message={error?.error} onDismiss={() => {}} />
        )}

        <Input
          label={t('signup.firstName')}
          placeholder={t('signup.firstNamePlaceHolder')}
          onChangeText={(value) => {
            onChange({ name: 'FIRSTNAME', value });
          }}
          /// actually error?.first_name should come from server but our server doesnot support it
          error={errors.FIRSTNAME || error?.first_name?.[0]}
        />

        <Input
          label={t('signup.lastName')}
          placeholder={t('signup.lastNamePlaceHolder')}
          onChangeText={(value) => {
            onChange({ name: 'LASTNAME', value });
          }}
          error={errors.LASTNAME || error?.last_name?.[0]}
        />
        <Input
          label={t('signup.email')}
          placeholder={t('signup.emailPlaceHolder')}
          onChangeText={(value) => {
            onChange({ name: 'EMAIL', value });
          }}
          error={errors.EMAIL || error?.email?.[0]}
        />

        <Input
          label={t('signup.address')}
          placeholder={t('signup.addressPlaceHolder')}
          onChangeText={(value) => {
            onChange({ name: 'ADDRESS', value });
          }}
          error={errors.ADDRESS || error?.address?.[0]}
        />
        <Input
          label={t('signup.password')}
          placeholder={t('signup.passwordPlaceHolder')}
          icon={
            <Pressable
              onPress={() => setIsSecureEntry((prev) => !prev)}
              style={({ pressed }) => pressed && { opacity: 0.5 }}
            >
              <Text>{!isSecureEntry ? 'HIDE' : 'SHOW'}</Text>
            </Pressable>
          }
          iconPosition='right'
          secureTextEntry={isSecureEntry}
          onChangeText={(value) => {
            onChange({ name: 'PASSWORD', value });
          }}
          error={errors.PASSWORD || error?.password?.[0]}
        />
        <CustomButton
          title={'Submit'}
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
        />

        <View style={styles.createSection}>
          <Text style={styles.infoText}>{t('signup.alreadyAccount')}</Text>

          <CustomPressable
            onPress={() => {
              navigation.navigate(LOGIN);
            }}
          >
            <Text style={styles.linkButton}>{t('screens.login')}</Text>
          </CustomPressable>
        </View>
      </View>
    </>
  );
};

export default Signup;

const styles = StyleSheet.create({
  logo: {
    height: 150,
    width: '100%',
    alignSelf: 'center',
    marginTop: 50,
    resizeMode: 'contain',
  },
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
  createSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  linkButton: {
    paddingLeft: 17,
    color: colors.primary,
    fontSize: 16,
  },
  infoText: {
    fontSize: 17,
  },
});
