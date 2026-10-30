import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import './HowItWorksPage.css';

const FAQ_ITEMS = [
  {
    q: 'Can I apply for schemes directly on SchemeSathi?',
    a: 'No. SchemeSathi is an independent informational guidance and discovery platform. Users cannot apply for schemes directly on our website. We analyze your demographic criteria, provide document readiness checklists, and direct you with verified links to official Central and State Government portals (e.g., NSP, PM-KISAN, MahaDBT) where applications are officially submitted and processed.'
  },
  {
    q: 'Is SchemeSathi free to use for Indian citizens?',
    a: 'Yes, SchemeSathi is 100% free of charge for all citizens. We do not charge any fee for browsing schemes, testing eligibility, downloading documentation checklists, or accessing official guidance.'
  },
  {
    q: 'What is Direct Benefit Transfer (DBT) and how does it work?',
    a: 'Direct Benefit Transfer is the Government of India’s direct payment mechanism where subsidies, scholarships, and pension grants are transferred directly by ministries into the beneficiary’s bank account linked with their Aadhaar through NPCI. SchemeSathi guides citizens on how to verify that their bank account is Aadhaar-seeded and how to track disbursements through official government portals.'
  },
  {
    q: 'How does SchemeSathi calculate my eligibility?',
    a: 'Our intelligent rule engine evaluates your basic demographic criteria—such as your age, gender, state of domicile, family annual income, social category (General, OBC, SC, ST, EWS), and occupation—against official eligibility rules gazetted by Central and State Ministries.'
  },
  {
    q: 'Does SchemeSathi submit official applications on my behalf?',
    a: 'No, SchemeSathi never submits applications on your behalf or acts as an agent. We provide direct links to authentic Government portals (such as National Scholarship Portal, PM-Kisan Portal, or State Seva Kendras) with clear walkthrough guides. For offline schemes, we provide downloadable forms and district nodal office addresses.'
  },
  {
    q: 'How is my personal data and document privacy secured?',
    a: 'SchemeSathi complies strictly with Indian Digital Personal Data Protection standards. All communications are encrypted via SSL/TLS (HTTPS) and sensitive identifiers are stored with AES-256 standard encryption. Your data is never sold or shared with commercial third parties.'
  },
  {
    q: 'What if I am from a specific Indian State?',
    a: 'SchemeSathi covers both All-India Central Sector initiatives and State-specific welfare programs. When you specify your home State (e.g., Maharashtra, Uttar Pradesh, Tamil Nadu), the platform customizes and prioritizes regional state schemes tailored for your location.'
  }
];

export default function HowItWorksPage() {
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  const toggleFaq = (index) => {
    setOpenFaqIndex(prev => (prev === index ? null : index));
  };

  return (
    <div className="how-it-works-page">
      <Header />

      <main className="how-main-content">
        <div className="how-container">
          {/* Hero Section */}
          <div className="how-hero">
            <div className="how-hero-badge">
              <i className="fa fa-circle-nodes"></i> Simplified Citizen Welfare Discovery
            </div>
            <h1 className="how-hero-title">
              How SchemeSathi Works: <span className="gradient-text-indigo">Simplifying Welfare</span> <span className="gradient-text-teal">Access for All</span>
            </h1>
            <p className="how-hero-desc">
              Discovering and applying for government schemes shouldn’t involve endless queues, confusing rules, or middleman fees. Learn how our 4-step digital framework connects you directly to your entitlements.
            </p>
            <div className="how-hero-actions">
              <Link to="/explore" className="btn-cta-primary" style={{ color: '#ffffff' }}>
                <i className="fa fa-compass" style={{ color: '#ffffff' }}></i> Explore All Schemes
              </Link>
              <Link to="/login?mode=register" className="btn-cta-secondary">
                <i className="fa fa-user-plus"></i> Create Free Profile
              </Link>
            </div>
          </div>

          {/* 4-Step Roadmap Section */}
          <section className="how-steps-section">
            <div className="section-header-center">
              <h2>4 Simple Steps: From Discovery to Official Portal Submission</h2>
              <p>A transparent, guided digital pathway designed to ensure you discover, prepare, and apply via official government portals without confusion.</p>
            </div>

            <div className="how-steps-grid">
              {/* Step 1 */}
              <div className="how-step-card">
                <div className="step-card-number">01</div>
                <div className="step-card-content">
                  <h3>Build Your Single Citizen Profile</h3>
                  <p>
                    Complete a simple, one-time profile setup. You only need to provide basic demographic criteria so the system understands your background.
                  </p>
                  <ul className="step-card-points">
                    <li><i className="fa fa-check"></i> Age, Gender, and State / District of domicile</li>
                    <li><i className="fa fa-check"></i> Social Category (General, OBC, SC, ST, EWS)</li>
                    <li><i className="fa fa-check"></i> Family Annual Income & Household Occupation</li>
                    <li><i className="fa fa-check"></i> Student, Farmer, or Landholding status</li>
                  </ul>
                </div>
              </div>

              {/* Step 2 */}
              <div className="how-step-card">
                <div className="step-card-number">02</div>
                <div className="step-card-content">
                  <h3>Intelligent Eligibility Matching</h3>
                  <p>
                    Instead of reading complex 50-page gazette notifications, our automated rule engine compares your profile against 100+ Central and State welfare initiatives.
                  </p>
                  <ul className="step-card-points">
                    <li><i className="fa fa-check"></i> Zero guesswork—see only schemes you qualify for</li>
                    <li><i className="fa fa-check"></i> Real-time calculation of potential financial benefits</li>
                    <li><i className="fa fa-check"></i> Direct notifications when new schemes match your profile</li>
                    <li><i className="fa fa-check"></i> Filter between Central and State Government programs</li>
                  </ul>
                </div>
              </div>

              {/* Step 3 */}
              <div className="how-step-card">
                <div className="step-card-number">03</div>
                <div className="step-card-content">
                  <h3>Document Readiness & Guided Application</h3>
                  <p>
                    Every scheme has unique paperwork rules. SchemeSathi provides an exact checklist of documents required before you begin your application.
                  </p>
                  <ul className="step-card-points">
                    <li><i className="fa fa-check"></i> Clear list of mandatory government certificates</li>
                    <li><i className="fa fa-check"></i> Official portal links for 1-click online submission</li>
                    <li><i className="fa fa-check"></i> Downloadable offline application forms & templates</li>
                    <li><i className="fa fa-check"></i> Local District Nodal Office contact guidance</li>
                  </ul>
                </div>
              </div>

              {/* Step 4 */}
              <div className="how-step-card">
                <div className="step-card-number">04</div>
                <div className="step-card-content">
                  <h3>Official Portal Submission & Guidance</h3>
                  <p>
                    Receive verified links to official Ministry portals, step-by-step guidance on submitting your application correctly, and instructions on how to track status directly on government dashboards.
                  </p>
                  <ul className="step-card-points">
                    <li><i className="fa fa-check"></i> Direct redirect to authentic Central & State government portals</li>
                    <li><i className="fa fa-check"></i> Step-by-step submission walkthrough & field guidance</li>
                    <li><i className="fa fa-check"></i> Official tracking guide using your government acknowledgment number</li>
                    <li><i className="fa fa-check"></i> Dedicated grievance directory and nodal helpline contacts</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Comparison Section */}
          <section className="how-comparison-section">
            <div className="section-header-center" style={{ marginBottom: '20px' }}>
              <h2>Why SchemeSathi? The Difference We Make</h2>
              <p>Compare the traditional bureaucratic experience with SchemeSathi’s citizen-centric digital portal.</p>
            </div>

            <div className="comparison-grid">
              <div className="comparison-box traditional">
                <div className="comparison-header">
                  <i className="fa fa-circle-xmark"></i> Traditional Bureaucratic Way
                </div>
                <ul className="comparison-list">
                  <li><i className="fa fa-xmark"></i> <span>Visiting dozens of disjointed, outdated department websites.</span></li>
                  <li><i className="fa fa-xmark"></i> <span>Unclear eligibility criteria causing rejected applications.</span></li>
                  <li><i className="fa fa-xmark"></i> <span>Exploitation by unauthorized middlemen charging commissions.</span></li>
                  <li><i className="fa fa-xmark"></i> <span>Long travel times and standing in lines at district offices.</span></li>
                  <li><i className="fa fa-xmark"></i> <span>Missing application deadlines due to lack of timely alerts.</span></li>
                </ul>
              </div>

              <div className="comparison-box schemesathi">
                <div className="comparison-header">
                  <i className="fa fa-circle-check"></i> The SchemeSathi Experience
                </div>
                <ul className="comparison-list">
                  <li><i className="fa fa-check"></i> <span>Single unified catalog of 100+ verified Central & State schemes.</span></li>
                  <li><i className="fa fa-check"></i> <span>Instant automated eligibility matching tailored to your exact profile.</span></li>
                  <li><i className="fa fa-check"></i> <span>100% free direct citizen access with zero intermediaries.</span></li>
                  <li><i className="fa fa-check"></i> <span>Complete document readiness playbook and step-by-step guidance.</span></li>
                  <li><i className="fa fa-check"></i> <span>Proactive notifications, deadline reminders, and status tracking.</span></li>
                </ul>
              </div>
            </div>
          </section>

          {/* Beneficiary Groups Section */}
          <section className="how-groups-section">
            <div className="section-header-center">
              <h2>Empowering Citizens Across Every Walk of Life</h2>
              <p>Dedicated welfare roadmaps for India's diverse communities.</p>
            </div>

            <div className="groups-grid">
              <div className="group-card">
                <div className="group-icon-circle blue">
                  <i className="fa fa-graduation-cap"></i>
                </div>
                <h4>Students & Youth</h4>
                <p>Pre-matric, post-matric, merit scholarships, coaching subsidies, and higher education loans.</p>
              </div>

              <div className="group-card">
                <div className="group-icon-circle green">
                  <i className="fa fa-tractor"></i>
                </div>
                <h4>Farmers & Agritech</h4>
                <p>PM-KISAN direct income, PM Fasal Bima crop insurance, micro-irrigation, and seed subsidies.</p>
              </div>

              <div className="group-card">
                <div className="group-icon-circle pink">
                  <i className="fa fa-person-dress"></i>
                </div>
                <h4>Women & Children</h4>
                <p>Maternity benefits, Sukanya Samriddhi girl child funds, Ladki Bahin, and SHG micro-credit.</p>
              </div>

              <div className="group-card">
                <div className="group-icon-circle amber">
                  <i className="fa fa-briefcase"></i>
                </div>
                <h4>Entrepreneurs & MSME</h4>
                <p>Mudra collateral-free business loans, PMEGP capital subsidies, and skill training programs.</p>
              </div>

              <div className="group-card">
                <div className="group-icon-circle purple">
                  <i className="fa fa-hand-holding-heart"></i>
                </div>
                <h4>Seniors & Divyangjan</h4>
                <p>National old age pensions, disability aids, free assistive devices, and Ayushman Bharat health cover.</p>
              </div>
            </div>
          </section>

          {/* Essential Documents Playbook */}
          <section className="how-docs-section">
            <div className="section-header-center" style={{ marginBottom: '10px' }}>
              <h2>Essential Documents Readiness Playbook</h2>
              <p>Having these 6 official documents ready will enable you to apply for 90% of government schemes in India.</p>
            </div>

            <div className="docs-grid">
              <div className="doc-playbook-item">
                <div className="doc-playbook-icon">
                  <i className="fa fa-id-card"></i>
                </div>
                <div className="doc-playbook-text">
                  <h5>1. Aadhaar Card</h5>
                  <p>Primary proof of identity and biometric verification. Ensure your active mobile number is linked for OTP verification.</p>
                </div>
              </div>

              <div className="doc-playbook-item">
                <div className="doc-playbook-icon">
                  <i className="fa fa-map-location-dot"></i>
                </div>
                <div className="doc-playbook-text">
                  <h5>2. Domicile / Residence Certificate</h5>
                  <p>Issued by the Tehsildar or Sub-Divisional Magistrate to confirm eligibility for State-specific quotas and schemes.</p>
                </div>
              </div>

              <div className="doc-playbook-item">
                <div className="doc-playbook-icon">
                  <i className="fa fa-receipt"></i>
                </div>
                <div className="doc-playbook-text">
                  <h5>3. Income Certificate / Ration Card</h5>
                  <p>Valid certificate verifying annual household family income for subsidized welfare and scholarship eligibility.</p>
                </div>
              </div>

              <div className="doc-playbook-item">
                <div className="doc-playbook-icon">
                  <i className="fa fa-users"></i>
                </div>
                <div className="doc-playbook-text">
                  <h5>4. Caste / Category Certificate</h5>
                  <p>Mandatory for SC, ST, OBC, and EWS beneficiaries to claim reserved affirmative welfare subsidies and fee waivers.</p>
                </div>
              </div>

              <div className="doc-playbook-item">
                <div className="doc-playbook-icon">
                  <i className="fa fa-building-columns"></i>
                </div>
                <div className="doc-playbook-text">
                  <h5>5. Bank Account (Aadhaar Seeded)</h5>
                  <p>Bank passbook copy or cancelled cheque. Account must be active and mapped on NPCI for Direct Benefit Transfer (DBT).</p>
                </div>
              </div>

              <div className="doc-playbook-item">
                <div className="doc-playbook-icon">
                  <i className="fa fa-file-contract"></i>
                </div>
                <div className="doc-playbook-text">
                  <h5>6. Education / Land Records</h5>
                  <p>School/college marksheets for scholarships, or 7/12 extract and RoR documents for farmer agriculture subsidies.</p>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ Accordion Section */}
          <section className="how-faq-section">
            <div className="section-header-center">
              <h2>Frequently Asked Questions</h2>
              <p>Everything you need to know about navigating government welfare through SchemeSathi.</p>
            </div>

            <div className="faq-list">
              {FAQ_ITEMS.map((item, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div key={idx} className={`faq-card ${isOpen ? 'open' : ''}`}>
                    <button
                      type="button"
                      className="faq-question-btn"
                      onClick={() => toggleFaq(idx)}
                      aria-expanded={isOpen}
                    >
                      <span>{item.q}</span>
                      <i className={`fa fa-chevron-down faq-toggle-icon`}></i>
                    </button>
                    {isOpen && (
                      <div className="faq-answer-box">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Bottom CTA Card */}
          <div className="explore-cta-card">
            <div className="explore-cta-text">
              <h3>Ready to access the schemes you qualify for?</h3>
              <p>
                Join thousands of Indian citizens who have simplified their government welfare applications with SchemeSathi.
              </p>
            </div>
            <div className="explore-cta-actions">
              <Link to="/login?mode=register" className="btn-cta-primary" style={{ color: '#ffffff' }}>
                <i className="fa fa-user-plus" style={{ color: '#ffffff' }}></i> Register for Free
              </Link>
              <Link to="/contact" className="btn-cta-secondary">
                <i className="fa fa-headset"></i> Contact Support
              </Link>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

