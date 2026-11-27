import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api, { errorPayload } from '../api/axios';
import { clearUser, getSavedUser, saveUser } from '../utils/session';

export const register = createAsyncThunk('auth/register', async (body, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/register', body);
    return data.data;
  } catch (e) {
    return rejectWithValue(errorPayload(e));
  }
});

export const login = createAsyncThunk('auth/login', async (body, { rejectWithValue }) => {
  try {
    console.log(body);
    
    const { data } = await api.post('/auth/login', body);
    return data.data;
  } catch (e) {
    return rejectWithValue(errorPayload(e));
  }
});

export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await api.post('/auth/logout');
  } catch {
    /* even if the request fails we still clear the local session */
  }
});

// Called once on app start: confirms the httpOnly cookie is still valid.
export const fetchMe = createAsyncThunk('auth/fetchMe', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/auth/me');
    return data.data;
  } catch (e) {
    return rejectWithValue(errorPayload(e));
  }
});

const initialState = {
  user: getSavedUser(), // optimistic value from the readable cookie, verified by fetchMe
  initialized: false,
  loading: false,
  error: null,
};

const startLoading = (state) => {
  state.loading = true;
  state.error = null;
};
const setUser = (state, action) => {
  state.loading = false;
  state.user = action.payload;
  saveUser(action.payload);
};
const setError = (state, action) => {
  state.loading = false;
  state.error = action.payload || { message: 'Something went wrong', errors: [] };
};
const endSession = (state) => {
  state.user = null;
  state.loading = false;
  clearUser();
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
    sessionExpired: endSession,
  },
  extraReducers: (builder) => {
    builder
      .addCase(register.pending, startLoading)
      .addCase(register.fulfilled, setUser)
      .addCase(register.rejected, setError)
      .addCase(login.pending, startLoading)
      .addCase(login.fulfilled, setUser)
      .addCase(login.rejected, setError)
      .addCase(logout.fulfilled, endSession)
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.initialized = true;
        state.user = action.payload;
        saveUser(action.payload);
      })
      .addCase(fetchMe.rejected, (state) => {
        state.initialized = true;
        endSession(state);
      });
  },
});

export const { clearAuthError, sessionExpired } = authSlice.actions;
export default authSlice.reducer;
