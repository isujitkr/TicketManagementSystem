import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import ticketsReducer from './ticketsSlice';
import adminReducer from './adminSlice';
import notificationsReducer from './notificationsSlice';
import uiReducer from './uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tickets: ticketsReducer,
    admin: adminReducer,
    notifications: notificationsReducer,
    ui: uiReducer,
  },
});
