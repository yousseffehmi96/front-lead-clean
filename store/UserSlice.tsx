// userSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit"

interface UserState {
  userId: string | null
  email: string | null
}

const initialState: UserState = {
  userId: null,
  email: null
}

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<{ userId: string; email: string }>) => {
      state.userId = action.payload.userId
      state.email = action.payload.email
    },
  },
})

export const { setUser } = userSlice.actions
export default userSlice.reducer