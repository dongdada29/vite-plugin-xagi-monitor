import React from 'react';
import './Header.css';

interface HeaderProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

const Header: React.FC<HeaderProps> = ({ currentPage, onPageChange }) => {
  const pages = [
    { id: 'home', name: '🏠 首页', description: '插件概览' },
    { id: 'error', name: '🚨 错误监控', description: '错误页面增强' },
    { id: 'console', name: '📡 远程控制台', description: '实时日志监控' },
    { id: 'whitescreen', name: '⚪ 白屏监控', description: '页面状态检测' },
    { id: 'design', name: '🎨 Design 模式', description: '可视化编辑' },
  ];

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="logo">
          <h1>XAgi Monitor</h1>
          <span className="subtitle">Vite 插件功能演示</span>
        </div>

        <nav className="nav-menu">
          {pages.map(page => (
            <button
              key={page.id}
              className={`nav-item ${currentPage === page.id ? 'active' : ''}`}
              onClick={() => onPageChange(page.id)}
              title={page.description}
            >
              <span className="nav-icon">{page.name.split(' ')[0]}</span>
              <span className="nav-text">{page.name.split(' ')[1]}</span>
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Header;