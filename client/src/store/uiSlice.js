import { createSlice, nanoid } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: { toasts: [] },
  reducers: {
    pushToast: {
      reducer(state, { payload }) {
        state.toasts.push(payload);
      },
      prepare(message, type = 'success') {
        return { payload: { id: nanoid(), message, type } };
      },
    },
    removeToast(state, { payload: id }) {
      state.toasts = state.toasts.filter((t) => t.id !== id);
    },
  },
});

export const { pushToast, removeToast } = uiSlice.actions;
export default uiSlice.reducer;
