import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api, { errorPayload } from '../api/axios';
import { cleanParams } from '../utils/format';
import { logout, sessionExpired } from './authSlice';

// Small helper so every thunk handles errors the same way.
const request = (fn) => async (arg, { rejectWithValue }) => {
  try {
    return await fn(arg);
  } catch (e) {
    return rejectWithValue(errorPayload(e));
  }
};

// ---- thunks -------------------------------------------------------------------------

export const fetchMyTickets = createAsyncThunk(
  'tickets/fetchMine',
  request(async (params) => {
    const { data } = await api.get('/tickets', { params: cleanParams(params) });
    return data;
  })
);

export const createTicket = createAsyncThunk(
  'tickets/create',
  request(async (body) => (await api.post('/tickets', body)).data.data)
);

export const updateTicket = createAsyncThunk(
  'tickets/update',
  request(async ({ id, body }) => (await api.patch(`/tickets/${id}`, body)).data.data)
);

export const deleteTicket = createAsyncThunk(
  'tickets/delete',
  request(async (id) => {
    await api.delete(`/tickets/${id}`);
    return id;
  })
);

export const fetchTicket = createAsyncThunk(
  'tickets/fetchOne',
  request(async (id) => (await api.get(`/tickets/${id}`)).data.data)
);

export const fetchComments = createAsyncThunk(
  'tickets/fetchComments',
  request(async (id) => (await api.get(`/tickets/${id}/comments`)).data.data)
);

export const addComment = createAsyncThunk(
  'tickets/addComment',
  request(async ({ ticketId, message }) => (await api.post(`/tickets/${ticketId}/comments`, { message })).data.data)
);

export const fetchTicketActivity = createAsyncThunk(
  'tickets/fetchActivity',
  request(async (id) => (await api.get(`/tickets/${id}/activity`)).data.data)
);

// Admin actions on a single ticket (kept here because they update the open ticket detail).
export const adminUpdateTicket = createAsyncThunk(
  'tickets/adminUpdate',
  request(async ({ id, body }) => (await api.patch(`/admin/tickets/${id}`, body)).data.data)
);

export const adminDeleteTicket = createAsyncThunk(
  'tickets/adminDelete',
  request(async (id) => {
    await api.delete(`/admin/tickets/${id}`);
    return id;
  })
);

// ---- slice --------------------------------------------------------------------------

const emptyPagination = { page: 1, limit: 10, total: 0, pages: 1 };

const initialState = {
  mine: { items: [], pagination: emptyPagination, loading: false, error: null },
  current: null,
  currentLoading: false,
  currentError: null,
  comments: [],
  commentsLoading: false,
  activity: [],
  saving: false, // create / update / comment in flight
  formError: null,
};

const ticketsSlice = createSlice({
  name: 'tickets',
  initialState,
  reducers: {
    clearCurrent(state) {
      state.current = null;
      state.currentError = null;
      state.comments = [];
      state.activity = [];
    },
    clearFormError(state) {
      state.formError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // list
      .addCase(fetchMyTickets.pending, (state) => {
        state.mine.loading = true;
        state.mine.error = null;
      })
      .addCase(fetchMyTickets.fulfilled, (state, { payload }) => {
        state.mine.loading = false;
        state.mine.items = payload.data;
        state.mine.pagination = payload.pagination;
      })
      .addCase(fetchMyTickets.rejected, (state, { payload }) => {
        state.mine.loading = false;
        state.mine.error = payload;
      })

      // detail
      .addCase(fetchTicket.pending, (state) => {
        state.currentLoading = true;
        state.currentError = null;
      })
      .addCase(fetchTicket.fulfilled, (state, { payload }) => {
        state.currentLoading = false;
        state.current = payload;
      })
      .addCase(fetchTicket.rejected, (state, { payload }) => {
        state.currentLoading = false;
        state.currentError = payload;
      })
      .addCase(fetchComments.pending, (state) => {
        state.commentsLoading = true;
      })
      .addCase(fetchComments.fulfilled, (state, { payload }) => {
        state.commentsLoading = false;
        state.comments = payload;
      })
      .addCase(fetchComments.rejected, (state) => {
        state.commentsLoading = false;
      })
      .addCase(fetchTicketActivity.fulfilled, (state, { payload }) => {
        state.activity = payload;
      })

      // create / update (shared "saving" + form error handling)
      .addCase(createTicket.pending, (state) => {
        state.saving = true;
        state.formError = null;
      })
      .addCase(createTicket.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(createTicket.rejected, (state, { payload }) => {
        state.saving = false;
        state.formError = payload;
      })
      .addCase(updateTicket.pending, (state) => {
        state.saving = true;
        state.formError = null;
      })
      .addCase(updateTicket.fulfilled, (state, { payload }) => {
        state.saving = false;
        state.current = payload;
      })
      .addCase(updateTicket.rejected, (state, { payload }) => {
        state.saving = false;
        state.formError = payload;
      })

      // delete (user)
      .addCase(deleteTicket.fulfilled, (state, { payload: id }) => {
        state.mine.items = state.mine.items.filter((t) => t._id !== id);
      })

      // comments
      .addCase(addComment.pending, (state) => {
        state.saving = true;
      })
      .addCase(addComment.fulfilled, (state, { payload }) => {
        state.saving = false;
        state.comments.push(payload);
      })
      .addCase(addComment.rejected, (state) => {
        state.saving = false;
      })

      // admin
      .addCase(adminUpdateTicket.fulfilled, (state, { payload }) => {
        if (state.current && state.current._id === payload._id) state.current = payload;
      })

      // wipe everything on logout / expired session so the next user starts clean
      .addCase(logout.fulfilled, () => initialState)
      .addCase(sessionExpired, () => initialState);
  },
});

export const { clearCurrent, clearFormError } = ticketsSlice.actions;
export default ticketsSlice.reducer;
