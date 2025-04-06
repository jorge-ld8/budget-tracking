import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Navbar from './components/Navbar'


type CardProps = {
  name: string
}

function Card({name}: CardProps) {
  const [count, setCount] = useState(0)
  return (
    <div className="bg-darkgreen p-4 rounded-lg m-4">
      <h1 className="text-3xl font-bold text-white">Hello {name} - {count}</h1>
      <button onClick={() => setCount(count + 1)}>Click me</button>
    </div>
  )
}


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