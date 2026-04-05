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

    // Construct full URL with forced base URL
    const baseUrl = 'https://crative.com/pages/build/';

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
    <>
      <div 
        className="toggle-switch"
        title="Share Configuration Link"
        onClick={handleShare}
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          cursor: 'pointer',
          borderRadius: '34px',
          background: copied ? 'rgba(79, 172, 254, 0.15)' : 'rgba(0,0,0,0.06)',
          transition: 'all 0.2s'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = copied ? 'rgba(79, 172, 254, 0.25)' : 'rgba(0,0,0,0.1)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = copied ? 'rgba(79, 172, 254, 0.15)' : 'rgba(0,0,0,0.06)';
        }}
      >
        <IoLinkOutline 
          size={19} 
          style={{ 
            color: copied ? 'var(--accent-color, #4facfe)' : '#555',
            transition: 'color 0.2s'
          }} 
        />
      </div>
      <span 
        className="toggle-label" 
        onClick={handleShare}
        title="Share Configuration Link"
        style={{
          cursor: 'pointer',
          color: copied ? 'var(--accent-color, #4facfe)' : 'inherit',
          transition: 'color 0.2s',
          userSelect: 'none'
        }}
      >
        {copied ? 'Link Copied!' : 'Share Link'}
      </span>
    </>
  );
}
