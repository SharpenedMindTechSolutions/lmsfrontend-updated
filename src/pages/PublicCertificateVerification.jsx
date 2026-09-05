import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { FiCheckCircle, FiXCircle, FiDownload } from 'react-icons/fi';

const BASE = import.meta.env.VITE_API_URL;

function PublicCertificateVerification() {
  const { certId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const certRef = useRef(null);

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await axios.get(`${BASE}/lms/certificates/verify/${certId}`);
        setData(res.data);
      } catch (err) {
        if (err.response?.status === 404) {
          setError('Certificate Not Found');
        } else if (err.response?.status === 400 && err.response.data?.certificate) {
          setData(err.response.data);
          setError(err.response.data.message);
        } else {
          setError('An error occurred during verification.');
        }
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [certId]);

  const handleDownload = async () => {
    if (!certRef.current) return;
    setDownloading(true);
    try {
      // Dynamically import html2canvas
      const { default: html2canvas } = await import('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/+esm');
      const canvas = await html2canvas(certRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });
      const link = document.createElement('a');
      link.download = `Certificate-${cert?.certificateId || 'download'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Download failed:', err);
      // Fallback: use window.print()
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0617' }}>
        <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }}></div>
      </div>
    );
  }

  const isValid = data?.isValid;
  const cert = data?.certificate;

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0a0617 0%, #130b2b 50%, #0f0a1e 100%)',
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '40px 20px',
      flexDirection: 'column'
    }}>
      
      {/* Top Status Banner */}
      <div style={{ marginBottom: 30, display: 'flex', alignItems: 'center', gap: 12, background: isValid ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', padding: '12px 24px', borderRadius: 50, border: `1px solid ${isValid ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
        {isValid ? <FiCheckCircle size={24} color="#34d399" /> : <FiXCircle size={24} color="#f87171" />}
        <span style={{ color: isValid ? '#6ee7b7' : '#fca5a5', fontWeight: 600, fontSize: 16 }}>
          {isValid ? 'Verified: Authentic Certificate' : (error || 'Invalid Certificate')}
        </span>
      </div>

      {cert && (
        <div ref={certRef} style={{
          position: 'relative',
          width: '100%',
          maxWidth: '1000px',
          background: '#fff',
          borderRadius: '4px',
          padding: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(212, 175, 55, 0.2)',
          overflow: 'hidden'
        }}>
          {/* Certificate Outer Golden Border */}
          <div style={{
            position: 'relative',
            border: '3px solid #d4af37',
            padding: '12px',
            background: '#fff',
            zIndex: 1
          }}>
            {/* Certificate Inner Navy Border */}
            <div style={{
              position: 'relative',
              border: '6px solid #0f172a',
              padding: '50px 40px',
              textAlign: 'center',
              background: 'radial-gradient(circle at center, #ffffff 0%, #fdfbf7 100%)',
              zIndex: 1
            }}>
              
              {/* Corner Ornaments */}
              <div style={{ position: 'absolute', top: 10, left: 10, width: 30, height: 30, borderTop: '2px solid #d4af37', borderLeft: '2px solid #d4af37' }}></div>
              <div style={{ position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderTop: '2px solid #d4af37', borderRight: '2px solid #d4af37' }}></div>
              <div style={{ position: 'absolute', bottom: 10, left: 10, width: 30, height: 30, borderBottom: '2px solid #d4af37', borderLeft: '2px solid #d4af37' }}></div>
              <div style={{ position: 'absolute', bottom: 10, right: 10, width: 30, height: 30, borderBottom: '2px solid #d4af37', borderRight: '2px solid #d4af37' }}></div>

              {/* Company Logo */}
              <img 
                src="/company%20logo.jpeg" 
                alt="Sharpened Mind Tech & Solutions" 
                style={{ height: '80px', objectFit: 'contain', marginBottom: '20px' }}
                onError={(e) => { e.target.style.display = 'none'; }} 
              />

              <h1 style={{ 
                fontFamily: 'Georgia, serif', 
                fontSize: '42px', 
                color: '#d4af37', 
                margin: '0 0 20px',
                letterSpacing: '3px',
                textTransform: 'uppercase',
                fontWeight: 700,
                textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
              }}>
                Course Completion Certificate
              </h1>
              
              <p style={{ color: '#334155', fontSize: '18px', margin: '30px 0 20px', fontStyle: 'italic', lineHeight: 1.6 }}>
                This is to certify that the recipient
              </p>

              <h2 style={{ 
                fontFamily: '"Great Vibes", cursive, Georgia, serif', 
                fontSize: '56px', 
                color: '#0f172a', 
                margin: '0 0 20px',
                fontWeight: 400
              }}>
                {cert.studentName}
              </h2>

              <p style={{ color: '#334155', fontSize: '18px', margin: '20px auto 30px', maxWidth: '750px', lineHeight: 1.7 }}>
                has <strong>successfully completed the Course on {cert.courseName}</strong>, organized by<br/>
                <span style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', display: 'inline-block', marginTop: '10px' }}>
                  Sharpened Mind Tech & Solutions Private Limited
                </span>
              </p>

              <p style={{ color: '#475569', fontSize: '15px', margin: '0 auto 40px', maxWidth: '700px', lineHeight: 1.6, fontStyle: 'italic' }}>
                We appreciate their enthusiasm, dedication, and commitment towards learning and successfully completing the course.
              </p>

              {/* Bottom Details */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'flex-end',
                marginTop: '60px',
                padding: '0 40px'
              }}>
                {/* Date */}
                <div style={{ textAlign: 'center', width: '220px' }}>
                  <div style={{ borderBottom: '1.5px solid #0f172a', paddingBottom: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '16px', color: '#0f172a', fontWeight: 600 }}>
                      {new Date(cert.issuedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                    </span>
                  </div>
                  <span style={{ color: '#d4af37', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>
                    Date Issued
                  </span>
                </div>

                {/* Center: Badge Image */}
                <img 
                  src="/badge.jpeg" 
                  alt="Certificate Badge" 
                  style={{ 
                    width: '140px', 
                    height: '140px', 
                    objectFit: 'contain',
                    flexShrink: 0
                  }}
                  onError={(e) => { e.target.style.display = 'none'; }} 
                />

                {/* Right side: Certificate ID */}
                <div style={{ textAlign: 'center', width: '220px' }}>
                  <div style={{ borderBottom: '1.5px solid #0f172a', paddingBottom: '8px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '16px', color: '#0f172a', fontFamily: 'Georgia, serif', fontWeight: 700, letterSpacing: '1px' }}>
                      {cert.certificateId}
                    </span>
                  </div>
                  <span style={{ color: '#d4af37', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700 }}>
                    Certificate ID
                  </span>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ marginTop: '30px', display: 'flex', gap: 16, alignItems: 'center' }}>
        {cert && (
          <button 
            onClick={handleDownload}
            disabled={downloading}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 28px',
              background: 'linear-gradient(135deg, #d4af37, #b8941e)',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: 700,
              cursor: downloading ? 'wait' : 'pointer',
              boxShadow: '0 4px 15px rgba(212, 175, 55, 0.4)',
              transition: 'all 0.2s',
              opacity: downloading ? 0.7 : 1
            }}
          >
            <FiDownload size={18} />
            {downloading ? 'Downloading…' : 'Download Certificate'}
          </button>
        )}
        <Link to="/" className="btn btn-ghost" style={{ color: '#a78bfa' }}>
          Return to Homepage
        </Link>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap');
        @media print {
          body * { visibility: hidden; }
          [data-certificate], [data-certificate] * { visibility: visible; }
          [data-certificate] { position: absolute; left: 0; top: 0; }
        }
      `}</style>
    </div>
  );
}

export default PublicCertificateVerification;
