// src/App.js
import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import EditorPage from './pages/EditorPage';
import AuthSuccess from './pages/AuthSuccess';


import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import ThemeToggle from './components/ThemeToggle';

function App() {
  return (
    <AuthProvider>

     <div className="fixed top-4 right-4 z-50">
            <ThemeToggle />
     </div>
     <Routes>
      <Routes>
        <Route path="/auth-success" element={<AuthSuccess />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/editor/:docId" element={
          <ProtectedRoute>
            <EditorPage />
          </ProtectedRoute>
        } />

      </Routes>
    </AuthProvider>
  );
}

export default App;
