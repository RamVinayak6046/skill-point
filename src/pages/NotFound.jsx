import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="notfound-page">
      <style>{`
        .notfound-page {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          font-family: system-ui, -apple-system, sans-serif;
          background-color: #f5f7fa;
          color: #111827;
          text-align: center;
          padding: 2rem;
        }

        .notfound-code {
          font-size: 8rem;
          font-weight: 800;
          color: #ea580c;
          line-height: 1;
          margin-bottom: 1rem;
        }

        .notfound-title {
          font-size: 2.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
        }

        .notfound-desc {
          font-size: 1.125rem;
          color: #6b7280;
          margin-bottom: 2.5rem;
          max-width: 500px;
        }

        .notfound-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }

        .notfound-btn-primary {
          background: #ea580c;
          color: white;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          text-decoration: none;
          font-weight: 500;
          transition: background 0.2s;
        }

        .notfound-btn-primary:hover {
          background: #c2410c;
        }

        .notfound-btn-outline {
          background: white;
          border: 1px solid #e5e7eb;
          color: #4b5563;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          text-decoration: none;
          font-weight: 500;
          transition: all 0.2s;
        }

        .notfound-btn-outline:hover {
          border-color: #ea580c;
          color: #ea580c;
        }
      `}</style>
      
      <div className="notfound-code">404</div>
      <h1 className="notfound-title">Page Not Found</h1>
      <p className="notfound-desc">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="notfound-actions">
        <Link to="/dashboard" className="notfound-btn-primary">Go to Dashboard</Link>
        <Link to="/" className="notfound-btn-outline">Back to Home</Link>
      </div>
    </div>
  );
};

export default NotFound;
