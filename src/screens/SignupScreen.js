import { StyleSheet, Text, View } from 'react-native';
import React, { useState } from 'react';
import Container from '../components/common/Container';
import Signup from '../components/SignUp/Signup';

// import envs from '../config/env';
import registerActions, {
  clearAuthState,
} from '../context/actions/registerActions';
import { GlobalContext } from '../context/reducers/Provider';

import { LOGIN } from '../constants/routeNames';

import * as EmailValidator from 'email-validator';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

const SignupScreen = () => {
  const { navigate } = useNavigation();
  const [form, setForm] = React.useState({});
  const [errors, setErrors] = useState({});

  const {
    authDispatch,
    authState: { error, loading, data },
  } = React.useContext(GlobalContext);

  // const {BACKEND_URL} = envs;

  const onChange = ({ name, value }) => {
    setForm({ ...form, [name]: value });

    if (value !== '') {
      // if not empty
      if (name === 'PASSWORD') {
        if (value.length < 6) {
          return setErrors({
            ...errors,
            [name]: 'Please Enter more than 6 character',
          });
        } else {
          return setErrors({ ...errors, [name]: null });
        }
      } else if (name === 'EMAIL') {
        if (!EmailValidator.validate(value)) {
          return setErrors({ ...errors, [name]: 'Please Enter a valid email' });
        } else {
          return setErrors({ ...errors, [name]: null });
        }
      } else {
        return setErrors({ ...errors, [name]: null });
      }
    } else {
      setErrors({ ...errors, [name]: 'This Field is required' });
    }
  };

  // React.useEffect(() => {
  //   if (data) {
  //     navigate(LOGIN);
  //   }
  // }, [data]);

  // when user goes to other screen and use in useCallback only check react navigation for details
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        // we need to run this when user leave the page that is why it is in return function of useeffect
        // we also need to clear error when user leaves this page ->so that if they thereis any error present and when user comes back to same page error will be shown to user

        if (data || error) {
          clearAuthState()(authDispatch);
        }
      };
    }, [data, error])
  );

  const onSubmit = () => {
    if (!form.ADDRESS) {
      setErrors((prev) => {
        return { ...prev, ADDRESS: 'Please Add an address' };
      });
    }
    if (!form.FIRSTNAME) {
      setErrors((prev) => {
        return { ...prev, FIRSTNAME: 'Please Add a first name' };
      });
    }
    if (!form.LASTNAME) {
      setErrors((prev) => {
        return { ...prev, LASTNAME: 'Please Add a last name' };
      });
    }
    if (!form.EMAIL) {
      setErrors((prev) => {
        return { ...prev, EMAIL: 'Please Add an email' };
      });
    }
    if (!form.PASSWORD) {
      setErrors((prev) => {
        return { ...prev, PASSWORD: 'Please Add a password' };
      });
    }

    if (
      Object.values(form).every((el) => el.trim().length > 0) &&
      Object.values(errors).every((el) => !el)
    ) {
      // WE ARE CALLING ACTION->registerActions WHICH WILL CALL REDUCER AND THEN REDUCER WILL UPDATE THE STORE

      // after authDispatch is caarrid the callback will be caarried out we have passes onSucccess as funtion to this action function after that we pass data to that function which is then later recieved by this
      registerActions(form)(authDispatch)((response) => {
        // third function is callback when user is created
        // now user is navigated to login page after account creation
        navigate(LOGIN, { data: response });
      });
    }
  };
  return (
    <Container>
      <Signup
        form={form}
        errors={errors}
        onChange={onChange}
        onSubmit={onSubmit}
        error={error}
        loading={loading}
      />
    </Container>
  );
};

export default SignupScreen;

const styles = StyleSheet.create({});
