import React, { useState } from 'react';
import Header from './Header';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState('home');

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <div className="page-content">{children}</div>;
      case 'error':
        return <div className="page-content">{children}</div>;
      case 'console':
        return <div className="page-content">{children}</div>;
      case 'whitescreen':
        return <div className="page-content">{children}</div>;
      case 'design':
        return <div className="page-content">{children}</div>;
      default:
        return <div className="page-content">{children}</div>;
    }
  };

  return (
    <div className="app-layout">
      <Header currentPage={currentPage} onPageChange={setCurrentPage} />
      <main className="app-main">
        {renderPage()}
      </main>
    </div>
  );
};

export default Layout;