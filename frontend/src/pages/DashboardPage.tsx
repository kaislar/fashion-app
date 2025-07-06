import React from 'react';

const DashboardPage: React.FC = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'flex-start',
    padding: '32px',
    minHeight: 'calc(100vh - 70px)'
  }}>
    <div style={{
      width: '100%',
      maxWidth: 1200,
      padding: 32,
      background: 'rgba(255,255,255,0.05)',
      borderRadius: 24,
      border: '1.5px solid rgba(255,255,255,0.18)',
      boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
      backdropFilter: 'blur(8px)',
    }}>
      <h2 style={{ fontWeight: 700, fontSize: 32, color: 'white', letterSpacing: 1, marginBottom: 24 }}>Dashboard</h2>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: 24 
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.10)',
          borderRadius: 20,
          padding: 24,
          border: '1.5px solid rgba(255,255,255,0.18)',
        }}>
          <h3 style={{ color: 'white', marginBottom: 12 }}>Total Products</h3>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#ff6b6b' }}>24</div>
        </div>
        <div style={{
          background: 'rgba(255,255,255,0.10)',
          borderRadius: 20,
          padding: 24,
          border: '1.5px solid rgba(255,255,255,0.18)',
        }}>
          <h3 style={{ color: 'white', marginBottom: 12 }}>Active Orders</h3>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#4ecdc4' }}>12</div>
        </div>
        <div style={{
          background: 'rgba(255,255,255,0.10)',
          borderRadius: 20,
          padding: 24,
          border: '1.5px solid rgba(255,255,255,0.18)',
        }}>
          <h3 style={{ color: 'white', marginBottom: 12 }}>Revenue</h3>
          <div style={{ fontSize: 32, fontWeight: 700, color: '#667eea' }}>$2,450</div>
        </div>
      </div>
    </div>
  </div>
);

export default DashboardPage; 