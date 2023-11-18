import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BASE_URL } from '../context/actions/registerActions';
// import {LOGOUT} from '../constants/routeNames';
// import { navigate } from '../navigations/SideMenu/RootNavigator';

let headers = {};

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers,
});

axiosInstance.interceptors.request.use(
  async (config) => {
    let token = await AsyncStorage.getItem('token');
    token = JSON.parse(token);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) =>
    new Promise((resolve, reject) => {
      resolve(response);
    }),
  (error) => {
    if (!error.response) {
      // not from server
      return new Promise((resolve, reject) => {
        reject(error);
      });
    }

    if (error.response.status === 403) {
      // navigate(LOGOUT, {tokenExpired: true});
      console.log(403403);
    } else {
      return new Promise((resolve, reject) => {
        console.log('error', error);
        reject(error);
      });
    }
  }
);

export default axiosInstance;
