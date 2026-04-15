import {configureStore} from '@reduxjs/toolkit'
import loadingReducer from '@/app/loadingSlice.ts'
import authReducer from '@/app/authSlice.ts'

export const store = configureStore({
    reducer: {
        loading: loadingReducer,
        auth: authReducer,
    },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch