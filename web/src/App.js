import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProductNew from './pages/ProductNew';
import VideoGenerate from './pages/VideoGenerate';
import VideoDetail from './pages/VideoDetail';
import Credits from './pages/Credits';
import FaceEffect from './pages/FaceEffect';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen">로딩중...</div>;
  return user ? children : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen">로딩중...</div>;
  return user ? <Navigate to="/dashboard" /> : children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            style: { background: '#1a1a2e', color: '#fff', border: '1px solid #333' },
          }}
        />
        <Routes>
          <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/products/new" element={<ProductNew />} />
            <Route path="/videos/generate/:productId" element={<VideoGenerate />} />
            <Route path="/videos/:id" element={<VideoDetail />} />
            <Route path="/credits" element={<Credits />} />
            <Route path="/face-effect" element={<FaceEffect />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
