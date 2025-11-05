import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import CakeStoriesForm from './components/CakeStoriesForm'
import CakeStoriesMobile from './components/CakeStoriesMobile'

function App() {
  return (
    <>
      {/* <CakeStoriesForm /> */}
      <CakeStoriesMobile />
    </>
  )
}

export default App
