import React, { useState } from 'react';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import './ContactPage.css';

const INDIAN_STATES = [
  'All India / Central',
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Delhi (NCT)',
  'Jammu & Kashmir',
  'Ladakh',
  'Puducherry',
  'Chandigarh',
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    state: 'Maharashtra',
    category: 'Scheme Eligibility & Guidance',
    schemeName: '',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setErrorMessage('Please fill in your name, email, and detailed message.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      // Frontend-only simulation (brief processing delay)
      await new Promise((resolve) => setTimeout(resolve, 600));

      const ticketId = `GRV-${Math.floor(100000 + Math.random() * 900000)}`;

      setSubmittedTicket({
        ticketId,
        name: formData.name,
        email: formData.email,
        category: formData.category,
        date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      });

      // Clear form
      setFormData({
        name: '',
        email: '',
        phone: '',
        state: 'Maharashtra',
        category: 'Scheme Eligibility & Guidance',
        schemeName: '',
        message: '',
      });
    } catch (err) {
      console.error('Failed to submit citizen query:', err);
      setErrorMessage('Failed to send query. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contact-page">
      <Header />

      <main className="contact-main-content">
        <div className="contact-container">
          {/* Hero Section */}
          <div className="contact-hero">
            <div className="contact-hero-badge">
              <i className="fa fa-headset"></i> Citizen Support & Grievance Cell
            </div>
            <h1 className="contact-hero-title">
              Contact SchemeSathi: <span className="gradient-text-indigo">We’re Here</span> to <span className="gradient-text-teal">Assist You</span>
            </h1>
            <p className="contact-hero-desc">
              Have questions about scheme eligibility, need help submitting your documents, or want to track an existing application? Our citizen support desk is available to guide you.
            </p>
          </div>

          {/* Quick Support Channels Grid */}
          <div className="contact-channels-grid">
            <div className="contact-channel-card">
              <div className="channel-icon-pill teal">
                <i className="fa fa-phone"></i>
              </div>
              <h4>National Toll-Free Helpline</h4>
              <div className="channel-value">1800-11-0001</div>
              <p>Mon – Sat, 9:00 AM – 6:00 PM IST. Multilingual assistance in Hindi, English, and Marathi.</p>
            </div>

            <div className="contact-channel-card">
              <div className="channel-icon-pill blue">
                <i className="fa fa-envelope"></i>
              </div>
              <h4>Official Email Support</h4>
              <div className="channel-value">support@schemesathi.in</div>
              <p>Email our citizen welfare team. Inquiries are reviewed and answered within 24 to 48 business hours.</p>
            </div>

            <div className="contact-channel-card">
              <div className="channel-icon-pill green">
                <i className="fa-brands fa-whatsapp"></i>
              </div>
              <h4>WhatsApp Citizen Desk</h4>
              <div className="channel-value">+91 98765 43210</div>
              <p>Automated scheme finder, essential document guidance, and instant help available on your phone.</p>
            </div>
          </div>

          {/* Form & Side Info Section */}
          <div className="contact-content-grid">
            {/* Left: Interactive Inquiry Form */}
            <div className="contact-form-card">
              {submittedTicket ? (
                <div className="inquiry-success-box">
                  <div className="success-check-bubble">
                    <i className="fa fa-check"></i>
                  </div>
                  <h4>Inquiry Successfully Logged!</h4>
                  <p>
                    Thank you, <strong>{submittedTicket.name}</strong>. Your inquiry has been registered in the SchemeSathi Administrative Feed. A support officer will review your query and send an official update to <strong>{submittedTicket.email}</strong>.
                  </p>
                  <div className="ticket-pill-display">
                    <i className="fa fa-ticket"></i> Reference Ticket: {submittedTicket.ticketId}
                  </div>
                  <div>
                    <button
                      type="button"
                      className="btn-card-apply"
                      onClick={() => setSubmittedTicket(null)}
                      style={{ margin: '0 auto', padding: '10px 24px' }}
                    >
                      <i className="fa fa-plus"></i> Submit Another Query
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h3>Submit a Citizen Inquiry or Feedback</h3>
                  <p className="form-subtitle">
                    Fill out the form below. Your query will be assigned a trackable ticket reference ID and dispatched to the relevant department coordinator.
                  </p>

                  {errorMessage && (
                    <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', color: '#be123c', padding: '12px 16px', borderRadius: '12px', marginBottom: '18px', fontSize: '13.5px' }}>
                      <i className="fa fa-circle-exclamation"></i> {errorMessage}
                    </div>
                  )}

                  <form onSubmit={handleSubmit}>
                    <div className="form-row-2">
                      <div className="form-group-item">
                        <label className="form-label-item">
                          Full Name <span className="req">*</span>
                        </label>
                        <input
                          type="text"
                          className="form-input-control"
                          placeholder="e.g. Ramesh Kumar"
                          value={formData.name}
                          onChange={(e) => handleChange('name', e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-group-item">
                        <label className="form-label-item">
                          Email Address <span className="req">*</span>
                        </label>
                        <input
                          type="email"
                          className="form-input-control"
                          placeholder="ramesh@example.com"
                          value={formData.email}
                          onChange={(e) => handleChange('email', e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-row-2">
                      <div className="form-group-item">
                        <label className="form-label-item">Contact Mobile Number</label>
                        <input
                          type="tel"
                          className="form-input-control"
                          placeholder="10-digit mobile number"
                          value={formData.phone}
                          onChange={(e) => handleChange('phone', e.target.value)}
                        />
                      </div>

                      <div className="form-group-item">
                        <label className="form-label-item">State / Union Territory</label>
                        <select
                          className="form-input-control"
                          value={formData.state}
                          onChange={(e) => handleChange('state', e.target.value)}
                        >
                          {INDIAN_STATES.map((st) => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="form-row-2">
                      <div className="form-group-item">
                        <label className="form-label-item">Inquiry Subject / Category</label>
                        <select
                          className="form-input-control"
                          value={formData.category}
                          onChange={(e) => handleChange('category', e.target.value)}
                        >
                          <option value="Scheme Eligibility & Guidance">Scheme Eligibility & Guidance</option>
                          <option value="Application Status Follow-up">Application Status Follow-up</option>
                          <option value="Document Verification Guidance">Document Verification Guidance</option>
                          <option value="Direct Benefit Transfer (DBT) Inquiry">Direct Benefit Transfer (DBT) Inquiry</option>
                          <option value="Technical Website Assistance">Technical Website Assistance</option>
                          <option value="Official Citizen Grievance">Official Citizen Grievance</option>
                        </select>
                      </div>

                      <div className="form-group-item">
                        <label className="form-label-item">Scheme Name (Optional)</label>
                        <input
                          type="text"
                          className="form-input-control"
                          placeholder="e.g. PM-KISAN, Ladki Bahin, etc."
                          value={formData.schemeName}
                          onChange={(e) => handleChange('schemeName', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="form-group-item">
                      <label className="form-label-item">
                        Detailed Message / Query <span className="req">*</span>
                      </label>
                      <textarea
                        className="form-textarea-control"
                        placeholder="Describe your query, question, or grievance in detail..."
                        value={formData.message}
                        onChange={(e) => handleChange('message', e.target.value)}
                        required
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      className="btn-submit-inquiry"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <><i className="fa fa-spinner fa-spin"></i> Submitting Inquiry...</>
                      ) : (
                        <><i className="fa fa-paper-plane"></i> Submit Inquiry & Generate Ticket</>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>

            {/* Right: Citizen Service Charter */}
            <div className="contact-side-info">
              {/* Citizen Service Charter */}
              <div className="side-info-card">
                <h4>
                  <i className="fa fa-clock-rotate-left"></i> Citizen Service Charter
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div className="sla-pledge-box">
                    <i className="fa fa-circle-check"></i>
                    <div>
                      <strong style={{ fontSize: '13.5px', display: 'block', marginBottom: '3px' }}>24-Hour Acknowledgment</strong>
                      <p>Every logged ticket receives an automated tracking ID and initial queue verification within 24 hours.</p>
                    </div>
                  </div>

                  <div className="sla-pledge-box" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
                    <i className="fa fa-user-shield" style={{ color: '#16a34a' }}></i>
                    <div>
                      <strong style={{ fontSize: '13.5px', display: 'block', marginBottom: '3px', color: '#14532d' }}>Direct Department Escalation</strong>
                      <p style={{ color: '#166534' }}>Unresolved grievance tickets are formally routed to district nodal officers for resolution.</p>
                    </div>
                  </div>

                  <div className="sla-pledge-box" style={{ background: '#faf5ff', borderColor: '#e9d5ff' }}>
                    <i className="fa fa-lock" style={{ color: '#7c3aed' }}></i>
                    <div>
                      <strong style={{ fontSize: '13.5px', display: 'block', marginBottom: '3px', color: '#581c87' }}>100% Privacy & Data Security</strong>
                      <p style={{ color: '#6b21a8' }}>Your personal contact details and grievances are confidential and protected with AES-256 encryption.</p>
                    </div>
                  </div>

                  <div className="sla-pledge-box" style={{ background: '#f8fafc', borderColor: '#e2e8f0' }}>
                    <i className="fa fa-clock" style={{ color: '#475569' }}></i>
                    <div>
                      <strong style={{ fontSize: '13.5px', display: 'block', marginBottom: '3px', color: '#1e293b' }}>Operating Hours</strong>
                      <p style={{ color: '#475569' }}>Monday to Saturday, 9:00 AM – 6:00 PM IST. Closed on National Holidays.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

