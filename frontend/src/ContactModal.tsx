import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { track } from './utils/analytics';

// @author Claude Sonnet 4.6 Anthropic
interface ContactModalProps {
  onClose: () => void;
}

const ContactModal = ({ onClose }: ContactModalProps): React.ReactElement => {
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    track('contact_modal_opened', {});
    previousFocusRef.current = document.activeElement as HTMLElement;
    closeRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const modal = (
    <>
      <div
        className="heatmap-modal-backdrop story-detail-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="heatmap-modal-card contact-modal-card"
        role="dialog"
        aria-modal="true"
        aria-label="Contact"
      >
        <div className="heatmap-modal-header">
          <span className="heatmap-modal-country">Get in touch</span>
          <button
            ref={closeRef}
            className="heatmap-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="contact-modal-body">
          <p className="contact-modal-intro">
            Feedback, questions, or just want to say hello? Reach out via GitHub or LinkedIn.
          </p>
          <div className="contact-modal-links">
            <a
              href="https://github.com/rssrn/newschart/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="contact-modal-link"
              onClick={() => track('contact_link_clicked', { target: 'github' })}
            >
              <svg className="contact-modal-link-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.866-.013-1.7-2.782.604-3.369-1.341-3.369-1.341-.454-1.154-1.11-1.461-1.11-1.461-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.202 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
              </svg>
              <span className="contact-modal-link-label">Open a GitHub issue</span>
              <span className="contact-modal-link-sub">No account needed to read; free signup to post</span>
            </a>
            <a
              href="https://www.linkedin.com/in/rarnold/"
              target="_blank"
              rel="noopener noreferrer"
              className="contact-modal-link"
              onClick={() => track('contact_link_clicked', { target: 'linkedin' })}
            >
              <svg className="contact-modal-link-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              <span className="contact-modal-link-label">Message on LinkedIn</span>
              <span className="contact-modal-link-sub">Requires a LinkedIn account</span>
            </a>
          </div>
        </div>
      </div>
    </>
  );

  return ReactDOM.createPortal(modal, document.body);
};

export default ContactModal;
