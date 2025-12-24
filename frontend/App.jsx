import { useState } from 'react'
import './App.css'
import POSTreeStructure from './components/POSTreeStructure'
import MessageTracker from './components/MessageTracker'

function App() {
  const [activeTab, setActiveTab] = useState('tree')

  return (
    <div className="app">
      <header className="app-header">
        <h1>POS Management System</h1>
      </header>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'tree' ? 'active' : ''}`}
          onClick={() => setActiveTab('tree')}
        >
          POS Tree Structure
        </button>
        <button
          className={`tab ${activeTab === 'tracker' ? 'active' : ''}`}
          onClick={() => setActiveTab('tracker')}
        >
          Message Tracker
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'tree' ? <POSTreeStructure /> : <MessageTracker />}
      </div>
    </div>
  )
}

export default App
