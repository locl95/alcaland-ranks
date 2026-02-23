import { Provider } from 'react-redux'
import { store } from '@/app/store'
import App from "@/app/App";
import { createRoot } from 'react-dom/client'

const root = createRoot(
    document.getElementById('root')
)

root.render(
    <Provider store={store}>
        <App />
    </Provider>
)