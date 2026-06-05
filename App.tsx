import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { PersistenceProvider } from './src/context/PersistenceContext';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <AuthProvider>
      <PersistenceProvider>
        <StatusBar style="light" />
        <AppNavigator />
      </PersistenceProvider>
    </AuthProvider>
  );
}
