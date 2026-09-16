import { useState } from 'react'
import './App.css'

function App() {

  const [count, setCount] = useState(0);

  return (
    <>
      <p>Hello Word</p>
      <button onClick={() => setCount(count + 1)}>
        Count {count}
      </button>
    </>
  )
}

export default App
