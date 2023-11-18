import {
  PROFILE_FAILED,
  PROFILE_SUCCESS,
  PROFILE_LOADING,
  PROFILE_UPDATE_SUCCESS,
} from '../../constants/actionTypes';

const authReducer = (state, {type, payload}) => {
  switch (type) {
    case PROFILE_LOADING:
      return {
        ...state,
        loading: true,
      };

    case PROFILE_FAILED:
      return {
        ...state,
        loading: false,
        error: payload,
      };
    case PROFILE_SUCCESS:
      return {
        ...state,
        loading: false,
        data: payload,
      };
    case PROFILE_UPDATE_SUCCESS:
      return {
        ...state,
        data: {
          ...state.data,
          ['emailAddress']: payload.email,
          ['lastName']: payload.lastName,
          ['firstName']: payload.firstName,
          ['address']: payload.address,
        },
        error: null,
        loading: false,
      };

    default:
      return state;
  }
};

export default authReducer;
