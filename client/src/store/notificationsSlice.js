import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api, { errorPayload } from '../api/axios';
import { logout, sessionExpired } from './authSlice';

export const fetchNotifications = createAsyncThunk(
  'notifications/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/notification', { params: { limit: 15 } });
      return data;
    } catch (e) {
      return rejectWithValue(errorPayload(e));
    }
  }
);

export const markNotificationRead = createAsyncThunk('notifications/markRead', async (id) => {
  await api.patch(`/notification/${id}/read`);
  return id;
});

export const markAllNotificationsRead = createAsyncThunk('notifications/markAllRead', async () => {
  await api.patch('/notification/read-all');
});

const initialState = { items: [], unreadCount: 0, loading: false };

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchNotifications.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.items = payload.data;
        state.unreadCount = payload.unreadCount;
      })
      .addCase(fetchNotifications.rejected, (state) => {
        state.loading = false;
      })
      .addCase(markNotificationRead.fulfilled, (state, { payload: id }) => {
        const item = state.items.find((n) => n._id === id);
        if (item && !item.isRead) {
          item.isRead = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.items.forEach((n) => {
          n.isRead = true;
        });
        state.unreadCount = 0;
      })
      .addCase(logout.fulfilled, () => initialState)
      .addCase(sessionExpired, () => initialState);
  },
});

export default notificationsSlice.reducer;
