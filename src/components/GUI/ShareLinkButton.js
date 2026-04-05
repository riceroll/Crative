import React, { useContext, useState } from 'react';
import { CrateContext } from '../../store/CrateContext';
import { IoLinkOutline } from 'react-icons/io5';

export default function ShareLinkButton() {
  const { displayDims, useInch, selectedCandidateId, candidateCrates } = useContext(CrateContext);
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    // Determine the selected design index
    const designIndex = candidateCrates.findIndex(c => c.id === selectedCandidateId);

    // Build the URL parameters keeping existing ones
    const params = new URLSearchParams(window.location.search);
    params.set('width', displayDims.width);
    params.set('height', displayDims.height);
    params.set('depth', displayDims.depth);
    params.set('unit', useInch ? 'inch' : 'cm');
    if (designIndex >= 0) {
      params.set('designIndex', designIndex);
    }

    // Construct full URL
    const baseUrl = window.location.origin + window.location.pathname;
    const fullUrl = `${baseUrl}?${params.toString()}`;

    const fallbackCopy = (text) => {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      
      // Avoid scrolling to bottom
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";

      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        const successful = document.execCommand('copy');
        if (successful) {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } else {
          console.error('Fallback: Copying text command was unsuccessful');
        }
      } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
      }

      document.body.removeChild(textArea);
    };

    // Copy to clipboard
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(fullUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }).catch(err => {
        console.warn('Clipboard API failed, using fallback.', err);
        fallbackCopy(fullUrl);
      });
    } else {
      fallbackCopy(fullUrl);
    }
  };

  return (
    <button
      onClick={handleShare}
      title="Share Configuration Link"
      style={{
        display: 'flex',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        background: '#f9f9f9',
        border: 'none',
        borderRadius: '6px',
        padding: '8px 12px',
        color: copied ? 'var(--accent-color, #4facfe)' : 'var(--text-color, #333)',
        fontSize: '13px',
        fontWeight: '500',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.background = '#f0f0f0';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.background = '#f9f9f9';
      }}
    >
      <IoLinkOutline size={18} style={{ color: copied ? 'var(--accent-color, #4facfe)' : 'var(--accent-color, #888)' }} />
      <span>{copied ? 'Link Copied!' : 'Copy Share Link'}</span>
    </button>
  );
}
