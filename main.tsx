import React from 'react'
import ReactDOM from 'react-dom/client'
// 假设你的主页面组件叫 App，在下面第三步我们会检查它
import App from './App' 

// 这一步是把 React 组件挂载到 HTML 里的 <div id="root">
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
