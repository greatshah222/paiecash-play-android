import React, { createContext, useReducer } from 'react';

import authInitialState from '../initialStates/authInitialState';
import eventInitialState from '../initialStates/eventInitialState';
import profileInitialState from '../initialStates/profileInitialState';
import authReducer from './authReducer';
import eventReducer from './eventReducer';
import profileReducer from './profileReducer';

export const GlobalContext = createContext({});

const GlobalProvider = ({ children }) => {
  const [authState, authDispatch] = useReducer(authReducer, authInitialState);

  const [eventState, eventDispatch] = useReducer(
    eventReducer,
    eventInitialState
  );

  const [profileState, profileDispatch] = useReducer(
    profileReducer,
    profileInitialState
  );

  const [user, setUser] = React.useState({});

  const value = {
    authState,
    authDispatch,

    eventDispatch,
    eventState,

    profileState,
    profileDispatch,

    user,
    setUser,
  };
  return (
    <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>
  );
};

export default GlobalProvider;
