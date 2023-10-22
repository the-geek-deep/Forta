import React from 'react';
import { Link } from 'react-router-dom';

function Header() {
    
  return (
    <header className="mt-3 py-1">
      <div className="container">
        <p className="float-end mb-1">
          <Link to="/">
            Wallet
          </Link>
        </p>
      </div>
    </header>
  );
}

export default Header;
