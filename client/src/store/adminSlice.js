import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api, { errorPayload } from '../api/axios';
import { cleanParams } from '../utils/format';
import { logout, sessionExpired } from './authSlice';
import { adminDeleteTicket, adminUpdateTicket } from './ticketsSlice';

const request = (fn) => async (arg, { rejectWithValue }) => {
  try {
    return await fn(arg);
  } catch (e) {
    return rejectWithValue(errorPayload(e));
  }
};

export const fetchAdminTickets = createAsyncThunk(
  'admin/fetchTickets',
  request(async (params) => {
    const { data } = await api.get('/admin/tickets', { params: cleanParams(params) });
    return data;
  })
);

export const fetchStats = createAsyncThunk(
  'admin/fetchStats',
  request(async () => (await api.get('/admin/stats')).data.data)
);

export const fetchUsers = createAsyncThunk(
  'admin/fetchUsers',
  request(async () => (await api.get('/admin/users')).data.data)
);

export const fetchActivityFeed = createAsyncThunk(
  'admin/fetchActivity',
  request(async (params) => (await api.get('/admin/activity', { params })).data)
);

const emptyPagination = { page: 1, limit: 10, total: 0, pages: 1 };

const initialState = {
  tickets: { items: [], pagination: emptyPagination, loading: false, error: null },
  stats: null,
  users: [],
  feed: { items: [], pagination: { ...emptyPagination, limit: 20 }, loading: false },
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminTickets.pending, (state) => {
        state.tickets.loading = true;
        state.tickets.error = null;
      })
      .addCase(fetchAdminTickets.fulfilled, (state, { payload }) => {
        state.tickets.loading = false;
        state.tickets.items = payload.data;
        state.tickets.pagination = payload.pagination;
      })
      .addCase(fetchAdminTickets.rejected, (state, { payload }) => {
        state.tickets.loading = false;
        state.tickets.error = payload;
      })
      .addCase(fetchStats.fulfilled, (state, { payload }) => {
        state.stats = payload;
      })
      .addCase(fetchUsers.fulfilled, (state, { payload }) => {
        state.users = payload;
      })
      .addCase(fetchActivityFeed.pending, (state) => {
        state.feed.loading = true;
      })
      .addCase(fetchActivityFeed.fulfilled, (state, { payload }) => {
        state.feed.loading = false;
        state.feed.items = payload.data;
        state.feed.pagination = payload.pagination;
      })
      .addCase(fetchActivityFeed.rejected, (state) => {
        state.feed.loading = false;
      })

      // keep the admin table in sync after an action performed from the table or detail page
      .addCase(adminUpdateTicket.fulfilled, (state, { payload }) => {
        const index = state.tickets.items.findIndex((t) => t._id === payload._id);
        if (index !== -1) state.tickets.items[index] = payload;
      })
      .addCase(adminDeleteTicket.fulfilled, (state, { payload: id }) => {
        state.tickets.items = state.tickets.items.filter((t) => t._id !== id);
      })

      .addCase(logout.fulfilled, () => initialState)
      .addCase(sessionExpired, () => initialState);
  },
});

export default adminSlice.reducer;
