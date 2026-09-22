import { AuthProvider } from './contexts/AuthContext';
import AppRouter from './router/AppRouter';

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
