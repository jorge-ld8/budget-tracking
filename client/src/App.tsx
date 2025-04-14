import './App.css'
import Navbar from './components/Navbar';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Transactions from './pages/Transactions';
import Accounts from './pages/Accounts';
import Budgets from './pages/Budgets';
import Login from './pages/Login';
import Register from './pages/Register';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
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
          
          <Route path="/accounts" element={
            <>
              <Navbar />
              <main className="container mx-auto px-4 py-8 mt-16 pt-4 text-gray-700">
                <Accounts />
              </main>
            </>
          } />
          
          <Route path="/budgets" element={
            <>
              <Navbar />
              <main className="container mx-auto px-4 py-8 mt-16 pt-4 text-gray-700">
                <Budgets />
              </main>
            </>
          } />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;