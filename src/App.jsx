import Router from "./routes";
import { LayoutProvider } from "./contexts/LayoutContext";
import { SettingsProvider } from "./contexts/SettingsContext";

function App() {
  return (
    <SettingsProvider>
      <LayoutProvider>
        <Router />
      </LayoutProvider>
    </SettingsProvider>
  );
}

export default App;
