import './App.css'
import Navbar from './components/Navbar';

function App() {
  return (
    <>
        <Navbar />
        <main className="container mx-auto px-4 py-8 mt-16 pt-4 text-gray-700">
          <h1 className="text-2xl font-bold text-white mb-4">Welcome to your Budget App</h1>
          <p className="text-white mb-4">This is a simple budget app that allows you to track your income and expenses.</p>
          <button className="bg-blue-500 text-white px-4 py-2 rounded-md">Get Started</button>
        </main>
    </>
  )
}

export default App