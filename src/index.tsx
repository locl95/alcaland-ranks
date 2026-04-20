import { Provider } from "react-redux";
import { QueryClientProvider } from "@tanstack/react-query";
import { store } from "@/app/store";
import { queryClient } from "@/app/queryClient";
import App from "@/app/App";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "@/styles/index.css";

const root = createRoot(document.getElementById("root"));

root.render(
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </Provider>,
);
