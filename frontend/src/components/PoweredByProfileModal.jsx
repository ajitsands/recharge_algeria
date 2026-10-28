import React, { useEffect } from 'react';
import { ExternalLink, Globe, MapPin, MessageCircle, Rocket, ShieldCheck, X } from 'lucide-react';
import './PoweredByProfileModal.css';

const supportLines = [
  { label: 'WhatsApp: 35078079', number: '97335078079' },
  { label: 'WhatsApp: 36533695', number: '97336533695' }
];

export default function PoweredByProfileModal({ open, onClose }) {
  useEffect(() => {
    if (!open) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="company-profile-overlay" onClick={onClose}>
      <section
        className="company-profile-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="company-profile-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="company-profile-header">
          <div className="company-profile-brand" aria-label="SaNDS Lab">
            <span className="company-profile-brand-mark">SaNDS<span>LAB</span></span>
            <span className="company-profile-brand-caption">Technology &amp; Innovation</span>
          </div>
          <div className="company-profile-heading">
            <h2 id="company-profile-title">SaNDS Lab Middle East W.L.L.</h2>
            <p>Company Profile &amp; 24/7 Technical Support</p>
          </div>
          <button className="company-profile-close" onClick={onClose} aria-label="Close company profile">
            <X size={19} />
          </button>
        </header>

        <div className="company-profile-content">
          <section className="company-support-box">
            <h3><MessageCircle size={19} /> Need Help or Support? We Are Active on WhatsApp</h3>
            <p>
              Direct Technical Support Lines (Bahrain): <strong>+973 35078079</strong>
              {' • '}<strong>+973 36533695</strong>
              {' | '}Tel: <a href="tel:+97377931123">+973 77931123</a>
            </p>
            <div className="company-whatsapp-actions">
              {supportLines.map(({ label, number }) => (
                <a key={number} href={`https://wa.me/${number}`} target="_blank" rel="noreferrer">
                  <MessageCircle size={16} /> {label}
                </a>
              ))}
            </div>
          </section>

          <p className="company-profile-description">
            Founded in <strong>2008</strong>, <strong>SaNDS Lab</strong> is a premier technology &amp; software
            engineering consultancy with over <strong>17 years of excellence</strong> delivering mission-critical
            enterprise applications, Artificial Intelligence platforms, hardware security systems, and smart
            workflow automation across the Middle East and Asia.
          </p>

          <div className="company-profile-facts">
            <span>🏢 Bahrain Commercial Registration: <strong>CR: 181123-1</strong></span>
            <span><MapPin size={14} /> Tech Hub: Infopark Thrissur, Kerala</span>
            <span><ShieldCheck size={14} /> ISO &amp; Bahrain PDPL Data Privacy Compliant</span>
          </div>

          <section className="company-products-box">
            <h3><Rocket size={19} /> Our Recent Enterprise Products &amp; Innovations</h3>
            <p>
              Explore our full suite of enterprise software platforms at{' '}
              <a href="https://sandslab.com/products/" target="_blank" rel="noreferrer">
                https://sandslab.com/products/
              </a>
            </p>
            <a className="company-products-button" href="https://sandslab.com/products/" target="_blank" rel="noreferrer">
              Visit Products Page <ExternalLink size={15} />
            </a>
          </section>
        </div>

        <footer className="company-profile-footer">
          <a href="https://wa.me/97335078079" target="_blank" rel="noreferrer">
            <MessageCircle size={14} /> WhatsApp: 35078079
          </a>
          <a href="https://wa.me/97336533695" target="_blank" rel="noreferrer">
            <MessageCircle size={14} /> WhatsApp: 36533695
          </a>
          <a href="https://sandslab.com/products/" target="_blank" rel="noreferrer">
            <Rocket size={14} /> sandslab.com/products/
          </a>
          <a href="https://www.sandslab.com" target="_blank" rel="noreferrer">
            <Globe size={14} /> www.sandslab.com
          </a>
          <button onClick={onClose}>Close Profile</button>
        </footer>
      </section>
    </div>
  );
}
