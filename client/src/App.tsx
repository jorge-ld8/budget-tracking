import './App.css'
import Navbar from './components/Navbar';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Transactions from './pages/Transactions';

function App() {
  return (
    <>
        <Navbar />
        <main className="container mx-auto px-4 py-8 mt-16 pt-4 text-gray-700">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/transactions" element={<Transactions />} />
          </Routes>
        </main>
    </>
  )
}

export default App