import React from 'react';
import { Link } from 'react-router-dom';
import { FOOTER_SECTIONS } from '../../utils/constants';
import './Footer.css';

/**
 * Footer Component - Multi-section footer with links and platform info
 */
function Footer() {
  const getYear = () => new Date().getFullYear();

  return (
    <footer className="footer" id="footer" role="contentinfo">
      <div className="footer__content">
        <div className="footer__container">
          <div className="footer__grid">
            {/* Quick Links Section */}
            <section className="footer__section">
              <h3 className="footer__section-title">Quick Links</h3>
              <nav className="footer__nav">
                <ul className="footer__links-list">
                  {FOOTER_SECTIONS.quickLinks.map((link) => (
                    <li key={link.href}>
                      <Link to={link.href} className="footer__link">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </section>

            {/* Company Info Section */}
            <section className="footer__section">
              <h3 className="footer__section-title">About SchemeSathi</h3>
              <div className="footer__about">
                <div className="footer__logo">
                  <i className="fa fa-shield-halved footer__logo-icon" aria-hidden="true"></i>
                  <span className="footer__logo-text">SchemeSathi</span>
                </div>
                <p className="footer__description">
                  Your companion for discovering government schemes and benefits tailored to your needs.
                </p>
              </div>
            </section>

            {/* Legal Links Section */}
            <section className="footer__section">
              <h3 className="footer__section-title">Legal</h3>
              <nav className="footer__nav">
                <ul className="footer__links-list">
                  {FOOTER_SECTIONS.legal.map((link) => (
                    <li key={link.href}>
                      <Link to={link.href} className="footer__link">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </section>
          </div>

          {/* Divider */}
          <div className="footer__divider"></div>

          {/* Copyright Section */}
          <div className="footer__copyright">
            <p className="footer__copyright-text">
              © {getYear()} SchemeSathi. All rights reserved.
            </p>
            <p className="footer__disclaimer">
              SchemeSathi is a discovery and information platform. Final eligibility and approval are determined by the respective government authorities. Always verify current requirements on official portals.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
