import { configureStore } from "@reduxjs/toolkit"
import SliceUser from './UserSlice'

export const store = configureStore({
    reducer: {
        user: SliceUser,
    },
})