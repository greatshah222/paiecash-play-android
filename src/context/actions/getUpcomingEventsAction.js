import {
  UPCOMING_EVENTS_FAILED,
  UPCOMING_EVENTS_LOADING,
  UPCOMING_EVENTS_SUCCESS,
} from '../../constants/actionTypes';
import axios from 'axios';
import { BASE_URL } from './registerActions';

export default (organizationId, limit = 10) =>
  async (dispatch) => {
    dispatch({
      type: UPCOMING_EVENTS_LOADING,
    });

    try {
      const currentTime = Date.now();
      let url = `${BASE_URL}/api/games?action=search&version=02&organizationId=${organizationId}&skip=0&limit=${limit}&from=${currentTime}`;

      console.log('urlupcoming', url);

      const res = await axios.get(url);
      if (res?.data?.status === 'ok') {
        dispatch({
          type: UPCOMING_EVENTS_SUCCESS,
          payload: res?.data?.games,
        });
      } else {
        dispatch({
          type: UPCOMING_EVENTS_FAILED,
          payload: { error: 'Server Error.Please Try Again' },
        });
      }
    } catch (error) {
      dispatch({
        type: UPCOMING_EVENTS_FAILED,
        payload: { error: 'Server Error.Please Try Again' },
      });
    }
  };
