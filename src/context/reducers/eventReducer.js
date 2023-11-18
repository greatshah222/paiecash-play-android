import {
  LIVE_EVENTS_FAILED,
  LIVE_EVENTS_LOADING,
  LIVE_EVENTS_SUCCESS,
  UPCOMING_EVENTS_FAILED,
  UPCOMING_EVENTS_LOADING,
  UPCOMING_EVENTS_SUCCESS,
  SINGLE_EVENT_FAILED,
  SINGLE_EVENT_LOADING,
  SINGLE_EVENT_SUCCESS,
} from '../../constants/actionTypes';

const eventReducer = (state, { type, payload }) => {
  switch (type) {
    case LIVE_EVENTS_LOADING:
      return {
        ...state,
        getLiveEvents: {
          ...state.getLiveEvents,
          loading: true,
          error: null,
        },
      };
    case LIVE_EVENTS_SUCCESS:
      return {
        ...state,
        getLiveEvents: {
          ...state.getLiveEvents,
          loading: false,
          data: payload,
        },
      };
    case LIVE_EVENTS_FAILED:
      return {
        ...state,
        getLiveEvents: {
          ...state.getLiveEvents,
          loading: false,
          error: payload,
        },
      };

    case UPCOMING_EVENTS_LOADING:
      return {
        ...state,
        getUpcomingEvents: {
          ...state.getUpcomingEvents,
          loading: true,
          error: null,
        },
      };
    case UPCOMING_EVENTS_SUCCESS:
      return {
        ...state,
        getUpcomingEvents: {
          ...state.getUpcomingEvents,
          loading: false,
          data: payload,
        },
      };
    case UPCOMING_EVENTS_FAILED:
      return {
        ...state,
        getUpcomingEvents: {
          ...state.getUpcomingEvents,
          loading: false,
          error: payload,
        },
      };

    case SINGLE_EVENT_LOADING:
      return {
        ...state,
        getSingleEvent: {
          ...state.getSingleEvent,
          loading: true,
          error: null,
        },
      };
    case SINGLE_EVENT_SUCCESS:
      console.log('payloadsuccess', payload);
      return {
        ...state,
        getSingleEvent: {
          ...state.getSingleEvent,
          loading: false,
          data: payload,
        },
      };
    case SINGLE_EVENT_FAILED:
      console.log('payload', payload);
      return {
        ...state,
        getSingleEvent: {
          ...state.getSingleEvent,
          loading: false,
          error: payload,
        },
      };

    default:
      return state;
  }
};

export default eventReducer;
