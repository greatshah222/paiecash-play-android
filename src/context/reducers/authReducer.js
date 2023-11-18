import {
  REGISTER_FAILED,
  REGISTER_LOADING,
  REGISTER_SUCCESS,
  CLEAR_AUTH_STATE,
  LOGIN_LOADING,
  LOGIN_FAILED,
  LOGIN_SUCCESS,
  LOGOUT_USER,
} from '../../constants/actionTypes';

const authReducer = (state, { type, payload }) => {
  switch (type) {
    case LOGIN_LOADING:
    case REGISTER_LOADING:
      return {
        ...state,
        loading: true,
      };
    case LOGIN_FAILED:
    case REGISTER_FAILED:
      return {
        ...state,
        loading: false,
        error: payload,
      };
    case REGISTER_SUCCESS:
      return {
        ...state,
        loading: false,
        data: payload,
      };

    case LOGIN_SUCCESS:
      console.log('payload', payload);
      return {
        ...state,
        loading: false,
        data: payload,
        isLoggedIn: true,
      };
    case CLEAR_AUTH_STATE:
      return {
        ...state,
        loading: false,
        error: null,

        data: null,
      };
    case LOGOUT_USER:
      return {
        ...state,
        loading: false,
        error: null,

        data: null,
        isLoggedIn: false,
      };
    default:
      return state;
  }
};

export default authReducer;
