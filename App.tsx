import React from "react";
import RootNavigator from "./src/navigation/RootNavigator";
import { AuthProvider } from "./src/context/AuthContext";
import { RemindersProvider } from "./src/context/RemindersContext";

export default function App() {
  return (
    <AuthProvider>
      <RemindersProvider>
        <RootNavigator />
      </RemindersProvider>
    </AuthProvider>
  );
}