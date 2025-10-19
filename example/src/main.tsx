import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
// 添加一个会导致 HTTP 500 错误的 CSS 文件引用
// import './non-existent-styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

