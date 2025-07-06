import React from 'react';

type HeaderBarProps = {
  isLoggedIn: boolean;
  onLoginClick?: () => void;
  onLogoClick?: () => void;
};

const HeaderBar: React.FC<HeaderBarProps> = ({ isLoggedIn, onLoginClick, onLogoClick }) => (
  <header style={{
    background: 'rgba(10,10,10,0.8)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    height: 64,
    display: 'flex',
    alignItems: 'center',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
  }}>
    <nav className="container" style={{ display: 'flex', alignItems: 'center', height: '100%', minHeight: 64, padding: 0, justifyContent: 'flex-start', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        <button className="logo" onClick={onLogoClick} style={{ fontSize: '2rem', fontWeight: 800, color: 'white', letterSpacing: 1, background: 'none', border: 'none', cursor: 'pointer' }}>VirtualFit</button>
        {!isLoggedIn && (
          <ul className="nav-links">
            <li><a href="#features">Features</a></li>
            <li><a href="#integration">Integration</a></li>
            <li><a href="#testimonials">Testimonials</a></li>
            <li><a href="#pricing">Pricing</a></li>
            <li><a href="/demo-store">Demo Store</a></li>
          </ul>
        )}
      </div>
      <div style={{ flex: 1 }} />
      {!isLoggedIn && (
        <button className="cta-button" onClick={onLoginClick}>Login</button>
      )}
    </nav>
  </header>
);

export default HeaderBar;
