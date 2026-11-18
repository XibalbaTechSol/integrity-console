import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { ArrowRight, ExternalLink, Mail, Phone } from 'lucide-react';

const PublicLayout: React.FC = () => {
  return (
    <div className="public-layout" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header className="public-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem 3rem', background: 'rgba(8, 17, 27, 0.8)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <Link to="/">
            <img src="https://xibalbatechsol.github.io/XibalbaSolutionsLogo.png" alt="Xibalba Solutions" style={{ height: '48px' }} />
          </Link>
          <a href="https://xibalbasolutions.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            Xibalba Solutions <ExternalLink size={12} />
          </a>
        </div>
        <div>
          <Link to="/auth" className="primary-button" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}>
            Launch Console <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="public-main" style={{ flex: 1, padding: '4rem 2rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="public-footer" style={{ marginTop: 'auto', padding: '2rem 3rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img src="https://xibalbatechsol.github.io/XibalbaSolutionsLogo.png" alt="Xibalba Solutions" style={{ height: '24px' }} />
          <span>&copy; {new Date().getFullYear()} Xibalba Solutions LLC. All rights reserved.</span>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <a href="https://xibalbasolutions.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>xibalbasolutions.com</a>
          <a href="mailto:jacob@xibalbasolutions.com" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <Mail size={13} /> jacob@xibalbasolutions.com
          </a>
          <a href="tel:+12628641589" style={{ color: 'var(--text-secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <Phone size={13} /> 1 (262) 864-1589
          </a>
          <Link to="/docs" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Documentation</Link>
          <Link to="/privacy" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Privacy Policy</Link>
          <Link to="/terms" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>Terms of Service</Link>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
