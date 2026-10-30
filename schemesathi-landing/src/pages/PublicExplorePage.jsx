import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { useAuth } from '../hooks/useAuth';
import './PublicExplorePage.css';

export default function PublicExplorePage() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="public-explore-page">
      <Header />

      <main className="public-explore-main">
        <div className="public-explore-container">
          {/* User Session Banner (if logged in) */}
          {isAuthenticated && (
            <div style={{
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              borderRadius: '14px',
              padding: '12px 20px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', color: '#166534', fontWeight: 600 }}>
                <i className="fa fa-user-check" style={{ color: '#16a34a' }}></i>
                <span>Logged in as <strong>{user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.email}</strong></span>
              </div>
              <Link to="/dashboard" style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#4338ca',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                Go to Citizen Dashboard <i className="fa fa-arrow-right"></i>
              </Link>
            </div>
          )}

          {/* Hero Section */}
          <div className="explore-hero-wrapper">
            <div className="explore-badge-pill">
              <i className="fa fa-compass"></i> Discover SchemeSathi Platform
            </div>
            <h1 className="explore-main-title">
              Explore the <span className="gradient-text-indigo">Next-Generation</span> Citizen <span className="gradient-text-teal">Welfare Guide</span>
            </h1>
            <p className="explore-hero-lead">
              SchemeSathi is an informational digital companion guiding every Indian citizen through verified Central and State Government welfare programs. Explore how our platform simplifies eligibility discovery and paperwork readiness.
            </p>
            <div className="explore-quick-cta-row">
              <Link to="/login?mode=register" className="btn-explore-primary" style={{ color: '#ffffff' }}>
                <i className="fa fa-user-plus" style={{ color: '#ffffff' }}></i> Join SchemeSathi Free
              </Link>
              <Link to="/how-it-works" className="btn-explore-secondary">
                <i className="fa fa-circle-question"></i> How It Works
              </Link>
            </div>
          </div>

          {/* Platform Metrics Bar */}
          <div className="explore-metrics-bar">
            <div className="explore-metric-card">
              <div className="metric-number">100+</div>
              <div className="metric-label">Verified Programs</div>
              <p className="metric-sub">Central & State government initiatives documented</p>
            </div>
            <div className="explore-metric-card">
              <div className="metric-number">10</div>
              <div className="metric-label">Welfare Sectors</div>
              <p className="metric-sub">Education, Ag, Health, Women, MSME</p>
            </div>
            <div className="explore-metric-card">
              <div className="metric-number">100%</div>
              <div className="metric-label">Free Guidance</div>
              <p className="metric-sub">Zero registration fees or service charges</p>
            </div>
            <div className="explore-metric-card">
              <div className="metric-number">Direct</div>
              <div className="metric-label">Official Links</div>
              <p className="metric-sub">Guidance to verified government portals</p>
            </div>
          </div>

          {/* Core Platform Pillars (6 Modules) */}
          <div className="explore-section-header">
            <span className="sub-badge">Platform Capabilities</span>
            <h2>The 6 Pillars Powering SchemeSathi</h2>
            <p>
              Designed from the ground up to guide Indian citizens through the complex landscape of government schemes with complete clarity and zero confusion.
            </p>
          </div>

          <div className="platform-pillars-grid">
            {/* Pillar 1 */}
            <div className="pillar-card">
              <div className="pillar-icon-box indigo">
                <i className="fa fa-brain"></i>
              </div>
              <h3>AI Eligibility Matcher</h3>
              <p>
                Our multi-factor rule engine evaluates your age, gender, caste category, annual income, and domicile to suggest only the schemes you qualify for.
              </p>
              <div className="pillar-feature-tags">
                <span className="feature-tag">Zero Guesswork</span>
                <span className="feature-tag">Eligibility Check</span>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="pillar-card">
              <div className="pillar-icon-box teal">
                <i className="fa fa-book-bookmark"></i>
              </div>
              <h3>100+ Verified Directory</h3>
              <p>
                Continuously curated from official Central Gazette notifications and State Government portals. Every scheme is documented with accurate criteria and benefits.
              </p>
              <div className="pillar-feature-tags">
                <span className="feature-tag">Official Sources</span>
                <span className="feature-tag">Clear Summaries</span>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="pillar-card">
              <div className="pillar-icon-box amber">
                <i className="fa fa-folder-open"></i>
              </div>
              <h3>Document Readiness Hub</h3>
              <p>
                Avoid rejected applications. SchemeSathi details the exact mandatory certificates needed (Aadhaar, Domicile, Income, Caste, Bank Passbook) with preparation tips.
              </p>
              <div className="pillar-feature-tags">
                <span className="feature-tag">Paperwork Guide</span>
                <span className="feature-tag">Checklists</span>
              </div>
            </div>

            {/* Pillar 4 */}
            <div className="pillar-card">
              <div className="pillar-icon-box emerald">
                <i className="fa fa-compass-drafting"></i>
              </div>
              <h3>Official Portal Navigation</h3>
              <p>
                Step-by-step guidance showing you exactly where and how to submit applications on verified government websites (such as NSP, PM-Kisan, or State Seva Kendras).
              </p>
              <div className="pillar-feature-tags">
                <span className="feature-tag">Official Links</span>
                <span className="feature-tag">Step-by-Step</span>
              </div>
            </div>

            {/* Pillar 5 */}
            <div className="pillar-card">
              <div className="pillar-icon-box purple">
                <i className="fa fa-bell"></i>
              </div>
              <h3>Deadline Alerts & Broadcasts</h3>
              <p>
                Never miss an application cycle. Citizens receive proactive notifications for opening dates, renewal windows, and special district verification camps.
              </p>
              <div className="pillar-feature-tags">
                <span className="feature-tag">In-App Alerts</span>
                <span className="feature-tag">Timely Reminders</span>
              </div>
            </div>

            {/* Pillar 6 */}
            <div className="pillar-card">
              <div className="pillar-icon-box rose">
                <i className="fa fa-shield-heart"></i>
              </div>
              <h3>Citizen Support & Advisory</h3>
              <p>
                Have questions about eligibility or paperwork? Our citizen advisory desk provides answers, troubleshooting guidance, and official helpline directories.
              </p>
              <div className="pillar-feature-tags">
                <span className="feature-tag">Toll-Free 1800</span>
                <span className="feature-tag">Advisory Desk</span>
              </div>
            </div>
          </div>

          {/* Bento Grid: The SchemeSathi Advantage */}
          <div className="bento-section">
            <div className="explore-section-header">
              <span className="sub-badge">Platform Architecture</span>
              <h2>Built on Modern Civic-Tech Principles</h2>
              <p>Designed for scale, simplicity, and inclusion across urban and rural India.</p>
            </div>

            <div className="bento-grid">
              <div className="bento-card span-2 accent-indigo">
                <div className="bento-icon-pill">
                  <i className="fa fa-shield-halved"></i>
                </div>
                <h3>Zero Middlemen. Pure Guidance. 100% Free.</h3>
                <p className="bento-sub">
                  Every link, document guide, and instruction on SchemeSathi points directly to official government repositories. By offering free independent guidance, we eliminate unauthorized middlemen and ensure citizens know their exact legal entitlements.
                </p>
              </div>

              <div className="bento-card">
                <div className="bento-icon-pill">
                  <i className="fa fa-language"></i>
                </div>
                <h3>Multilingual Access</h3>
                <p>
                  Available in English, Hindi, and Marathi with ongoing expansion to support regional languages across India.
                </p>
              </div>

              <div className="bento-card">
                <div className="bento-icon-pill">
                  <i className="fa fa-lock"></i>
                </div>
                <h3>Enterprise Security</h3>
                <p>
                  AES-256 encryption, strict adherence to Indian Data Protection principles, and zero selling of personal citizen records.
                </p>
              </div>

              <div className="bento-card span-2 accent-teal">
                <div className="bento-icon-pill">
                  <i className="fa fa-map-location-dot"></i>
                </div>
                <h3>All-India & State-Specific Alignment</h3>
                <p className="bento-sub">
                  Whether you reside in Maharashtra, Uttar Pradesh, Tamil Nadu, or Delhi, SchemeSathi filters schemes according to your State domicile, guiding you through both Central and State government welfare rules.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Immersive Call to Action Banner */}
          <div className="explore-bottom-cta">
            <div className="bottom-cta-text">
              <h3>Ready to discover the schemes you qualify for?</h3>
              <p>
                Create your free citizen profile in just 2 minutes to discover your eligibility, access document checklists, and receive step-by-step guidance on applying via official government portals.
              </p>
            </div>
            <div className="bottom-cta-actions">
              <Link to="/login?mode=register" className="btn-bottom-primary" style={{ color: '#ffffff' }}>
                <i className="fa fa-user-plus" style={{ color: '#ffffff' }}></i> Register for Free
              </Link>
              <Link to="/how-it-works" className="btn-bottom-secondary">
                <i className="fa fa-circle-question"></i> How It Works
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
