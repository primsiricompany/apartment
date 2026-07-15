import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// ทำการ Render Component หลัก (App) เข้าไปยัง Element ID 'root' ใน index.html
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)