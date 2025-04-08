import './App.css'
import Navbar from './components/Navbar';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Transactions from './pages/Transactions';
import Login from './pages/Login';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={
            <>
              <Navbar />
              <main className="container mx-auto px-4 py-8 mt-16 pt-4 text-gray-700">
                <Home />
              </main>
            </>
          } />
          
          <Route path="/dashboard" element={
            <>
              <Navbar />
              <main className="container mx-auto px-4 py-8 mt-16 pt-4 text-gray-700">
                <Home />
              </main>
            </>
          } />
          
          <Route path="/transactions" element={
            <>
              <Navbar />
              <main className="container mx-auto px-4 py-8 mt-16 pt-4 text-gray-700">
                <Transactions />
              </main>
            </>
          } />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;