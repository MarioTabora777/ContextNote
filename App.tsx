import React from "react";
import { Provider } from "react-redux";
import { store } from "./src/store";
import React, { useEffect } from "react";
import { Provider } from "react-redux";
import { store, useAppDispatch } from "./src/store";
import { loadUser } from "./src/store/authSlice";
import { loadReminders } from "./src/store/remindersSlice";
import RootNavigator from "./src/navigation/RootNavigator";

// Componente interno que carga los datos iniciales
function AppContent() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Cargar datos desde AsyncStorage al iniciar
    dispatch(loadUser());
    dispatch(loadReminders());
  }, [dispatch]);

  return <RootNavigator />;
}

// App principal con Provider de Redux
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