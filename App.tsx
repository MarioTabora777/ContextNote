import React from "react";
import { Provider } from "react-redux";
import { store } from "./src/store";
import RootNavigator from "./src/navigation/RootNavigator";
import { AuthProvider } from "./src/context/AuthContext";
import { RemindersProvider } from "./src/context/RemindersContext";

export default function App() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <RemindersProvider>
          <RootNavigator />
        </RemindersProvider>
      </AuthProvider>
    </Provider>
  );
}