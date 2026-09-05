import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { sessionAPI, testAPI, taskAPI } from '../../../services/student/api';
import api from '../../../services/student/api';
import {
  FiArrowLeft, FiCheckCircle, FiPlay, FiChevronLeft,
  FiChevronRight, FiLock, FiAlertTriangle, FiMaximize2,
  FiUnlock, FiBookOpen, FiShield, FiClock, FiWifiOff,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import EnrollmentGate from '../../../components/student/EnrollmentGate';
import VideoNotes from '../../../components/student/VideoNotes';
import DiscussionForum from '../../../components/discussion/DiscussionForum';
import AICopilotDrawer from '../../../components/ai/AICopilotDrawer';

/* ── Convert Google Drive share URL → embed URL ─────────── */
function toEmbed(url) {
  if (!url) return null;
  const m = url.match(/\/d\/([\w-]+)/);
  if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;
  return url;
}

/* ── localStorage helpers (keyed per test) ──────────────── */
const lsKey    = (testId, suffix) => `lms_test_${testId}_${suffix}`;
const lsGet    = (k)              => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
const lsSet    = (k, v)           => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const lsRemove = (k)              => { try { localStorage.removeItem(k); } catch {} };

/* ── Format seconds → MM:SS ─────────────────────────────── */
const fmt = (s) => {
  const m   = Math.floor(Math.abs(s) / 60).toString().padStart(2, '0');
  const sec = (Math.abs(s) % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
};

/* ── Constants ───────────────────────────────────────────── */
const MAX_VIOLATIONS = 2;
const AUTOSAVE_MS    = 8_000;
const WARN_5MIN_SEC  = 300;
const WARN_1MIN_SEC  = 60;

/* ── Mark as Read Confirmation Modal ─────────────────────── */
function MarkAsReadModal({ onConfirm, onCancel }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

  const handleCancel  = () => { setVisible(false); setTimeout(onCancel,  200); };
  const handleConfirm = () => { setVisible(false); setTimeout(onConfirm, 200); };

  return (
    <div
      onClick={handleCancel}
      style={{
        position: 'fixed', inset: 0, zIndex: 10000,
        background: 'rgba(10,6,25,0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.2s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(145deg, #1a0e35 0%, #120a28 100%)',
          border: '1px solid rgba(124,58,237,0.35)',
          borderRadius: '20px',
          padding: '32px 28px',
          maxWidth: 440, width: '100%',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset',
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.97)',
          transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        <div style={{
          width: 64, height: 64, borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(234,88,12,0.15))',
          border: '2px solid rgba(245,158,11,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px',
          boxShadow: '0 0 24px rgba(245,158,11,0.15)',
        }}>
          <FiAlertTriangle size={28} color="#f59e0b" />
        </div>

        <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 700, textAlign: 'center', margin: '0 0 12px', letterSpacing: '-0.02em' }}>
          Complete This Session?
        </h2>

        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14, lineHeight: 1.7, textAlign: 'center', margin: '0 0 8px' }}>
          By marking this session as completed, the related test will be unlocked.
        </p>

        {[
          'Make sure you have watched and understood the session content before continuing.',
          'The test can be attended only once. Please answer carefully before submitting.',
        ].map((txt, i) => (
          <div key={i} style={{
            background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: 10, padding: '10px 14px', marginBottom: 12,
            display: 'flex', alignItems: 'flex-start', gap: 10,
          }}>
            <FiShield size={15} color="#f59e0b" style={{ marginTop: 1, flexShrink: 0 }} />
            <p style={{ color: 'rgba(245,158,11,0.85)', fontSize: 13, lineHeight: 1.6, margin: 0 }}>{txt}</p>
          </div>
        ))}

        <div style={{ marginBottom: 28 }} />

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleCancel}
            style={{
              flex: 1, padding: '12px 16px',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 10, color: 'rgba(255,255,255,0.7)',
              fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            style={{
              flex: 1.4, padding: '12px 16px',
              background: 'linear-gradient(135deg, #7c3aed, #4c1d95)',
              border: '1px solid rgba(124,58,237,0.5)',
              borderRadius: 10, color: '#fff',
              fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
              boxShadow: '0 4px 16px rgba(124,58,237,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 6px 20px rgba(124,58,237,0.5)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(124,58,237,0.35)'}
          >
            <FiCheckCircle size={15} />
            Yes, Complete Session
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Video Player ────────────────────────────────────────── */
function VideoPlayer({ url, sessionId, onCompleted, isAlreadyCompleted, onTimeUpdate }) {
  const embed          = toEmbed(url);
  const isDrive        = !!embed;
  const reportedRef    = useRef(false);
  const onCompletedRef = useRef(onCompleted);
  const videoRef       = useRef(null);
  
  const sUser = (() => { try { return JSON.parse(sessionStorage.getItem('s_user')); } catch { return null; } })() || {};
  const watermarkText = sUser.name || sUser.email || 'STUDENT';

  const [isCompleted, setIsCompleted] = useState(isAlreadyCompleted || false);
  const [loadingProg, setLoadingProg] = useState(true);

  useEffect(() => {
    if (isAlreadyCompleted && !isCompleted) {
      setIsCompleted(true);
      reportedRef.current = true;
    }
  }, [isAlreadyCompleted]);

  useEffect(() => { onCompletedRef.current = onCompleted; }, [onCompleted]);

  useEffect(() => {
    if (!sessionId) { setLoadingProg(false); return; }
    api.get(`/lms/sessions/${sessionId}/video-progress`)
      .then(r => {
        if (r.data.isCompleted) { reportedRef.current = true; setIsCompleted(true); }
      })
      .catch(() => {})
      .finally(() => setLoadingProg(false));
  }, [sessionId]);

  if (!embed) return (
    <div style={{
      background: '#0f0a1e', height: 340,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      borderRadius: 14, color: 'rgba(255,255,255,.4)',
      flexDirection: 'column', gap: 12,
    }}>
      <FiPlay size={40} style={{ opacity: .3 }} />
      <p style={{ fontSize: 14 }}>No video link provided for this session.</p>
    </div>
  );

  return (
    <div style={{ position: 'relative', paddingBottom: '56.25%', background: '#0f0a1e', borderRadius: 14, overflow: 'hidden' }}>
      {isDrive ? (
        <iframe
          src={embed}
          title="Session Video"
          allow="autoplay; fullscreen"
          allowFullScreen
          sandbox="allow-scripts allow-same-origin allow-presentation"
          referrerPolicy="no-referrer"
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none', zIndex: 1 }}
        />
      ) : (
        <video 
          ref={videoRef}
          src={url}
          controls
          onTimeUpdate={(e) => onTimeUpdate?.(e.target.currentTime)}
          onEnded={() => {
            if (!isCompleted) {
              setIsCompleted(true);
              onCompletedRef.current?.();
            }
          }}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none', zIndex: 1, objectFit: 'contain' }}
        />
      )}
      
      {/* Anti-piracy watermark */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: 0.1, color: '#fff', fontSize: '24px', fontWeight: 'bold',
        textTransform: 'uppercase', transform: 'rotate(-20deg)',
        userSelect: 'none', mixBlendMode: 'overlay'
      }}>
        {watermarkText}
      </div>
      {loadingProg && (
        <div style={{
          position: 'absolute', top: 12, right: 12,
          background: 'rgba(0,0,0,0.55)', borderRadius: 20,
          padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 6,
          backdropFilter: 'blur(4px)',
        }}>
          <span className="spinner spinner-xs" style={{ width: 12, height: 12, borderWidth: 2 }} />
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Loading…</span>
        </div>
      )}
      {isCompleted && (
        <div style={{
          position: 'absolute', top: 12, right: 12,
          background: 'rgba(16,185,129,.9)', color: '#fff',
          borderRadius: 20, padding: '6px 14px', fontSize: 13, fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: 6, backdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.3s ease',
        }}>
          <FiCheckCircle size={14} /> Completed
        </div>
      )}
    </div>
  );
}

/* ── Timer Ring ──────────────────────────────────────────── */
function TimerRing({ secondsLeft, totalSeconds }) {
  const pct   = totalSeconds > 0 ? Math.max(0, secondsLeft / totalSeconds) : 0;
  const r     = 26;
  const circ  = 2 * Math.PI * r;
  const dash  = pct * circ;
  const color = secondsLeft <= WARN_1MIN_SEC ? '#ef4444'
              : secondsLeft <= WARN_5MIN_SEC ? '#f59e0b'
              : '#7c3aed';
  return (
    <div style={{ position: 'relative', width: 68, height: 68, flexShrink: 0 }}>
      <svg width="68" height="68" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="34" cy="34" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
        <circle
          cx="34" cy="34" r={r} fill="none"
          stroke={color} strokeWidth="4"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.9s linear, stroke 0.5s' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ color, fontSize: 12, fontWeight: 800, letterSpacing: '-0.03em' }}>
          {fmt(secondsLeft)}
        </span>
      </div>
    </div>
  );
}

/* ── Fullscreen Test Mode ────────────────────────────────── */
function FullscreenTest({ sessionId, onComplete, onClose }) {
  /* ── Core state ── */
  const [test,         setTest]       = useState(null);
  const [loading,      setLoading]    = useState(true);
  const [notFound,     setNotFound]   = useState(false);
  const [answers,      setAnswers]    = useState({});
  const [result,       setResult]     = useState(null);
  const [submitting,   setSub]        = useState(false);
  const [autoSubmitted,setAutoSub]    = useState(false);

  /* ── Timer state ── */
  const [secondsLeft,  setSecsLeft]   = useState(null);
  const [totalSeconds, setTotalSecs]  = useState(null);
  const warned5Ref  = useRef(false);
  const warned1Ref  = useRef(false);

  /* ── Proctoring ── */
  const [violations,  setViolations]  = useState(0);
  const [warning,     setWarning]     = useState(null);

  /* ── Network ── */
  const [offline,     setOffline]     = useState(!navigator.onLine);

  /* ── Stable refs ── */
  const submittingRef = useRef(false);
  const answersRef    = useRef({});
  const testRef       = useRef(null);
  const timerRef      = useRef(null);
  const autoSaveRef   = useRef(null);
  const endAtRef      = useRef(null);
  const containerRef  = useRef(null);

  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { testRef.current    = test;    }, [test]);

  /* ── Fullscreen on mount ── */
  useEffect(() => {
    const el = containerRef.current || document.documentElement;
    (el.requestFullscreen || el.webkitRequestFullscreen || (() => {})).call(el).catch(() => {});
    return () => { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); };
  }, []);

  /* ── Cleanup all intervals on unmount ── */
  useEffect(() => () => {
    clearInterval(timerRef.current);
    clearInterval(autoSaveRef.current);
  }, []);

  /* ── Core submit (single-flight via ref) ── */
  const doSubmit = useCallback(async ({ auto = false, reason = '' } = {}) => {
    if (submittingRef.current) return;
    const t = testRef.current;
    if (!t) return;

    submittingRef.current = true;
    setSub(true);
    clearInterval(timerRef.current);
    clearInterval(autoSaveRef.current);

    const answersArr = t.questions.map(q => ({
      questionId: q._id,
      answer:     answersRef.current[q._id] ?? '',
    }));

    try {
      const res = await testAPI.submit(t._id, answersArr);
      lsRemove(lsKey(t._id, 'answers'));
      lsRemove(lsKey(t._id, 'endAt'));

      if (auto) {
        setAutoSub(true);
        if (reason) toast.error(reason, { duration: 6000, icon: '⏰' });
      } else {
        toast.success(`Test submitted! Score: ${res.data.score}%`, { icon: '🏆' });
      }
      setResult(res.data);
      onComplete?.();
    } catch (err) {
      if (err?.response?.status === 409) {
        toast('Test already submitted.', { icon: 'ℹ️' });
        onComplete?.();
        onClose?.();
      } else {
        toast.error(err?.response?.data?.message || 'Submission failed. Please retry.');
        submittingRef.current = false;
      }
    } finally {
      setSub(false);
    }
  }, [onComplete, onClose]);

  /* ── Auto-save draft ── */
  const saveDraft = useCallback(() => {
    const t = testRef.current;
    if (!t || submittingRef.current) return;
    lsSet(lsKey(t._id, 'answers'), answersRef.current);
    if (navigator.onLine && testAPI.saveProgress) {
      const arr = t.questions.map(q => ({ questionId: q._id, answer: answersRef.current[q._id] ?? '' }));
      testAPI.saveProgress(t._id, arr).catch(() => {});
    }
  }, []);

  /* ── Timer tick (drift-corrected against absolute endAt) ── */
  const startTimer = useCallback((endAtMs, totalSec) => {
    endAtRef.current = endAtMs;
    setTotalSecs(totalSec);
    clearInterval(timerRef.current);

    const tick = () => {
      const remaining = Math.round((endAtRef.current - Date.now()) / 1000);
      if (remaining <= 0) {
        clearInterval(timerRef.current);
        setSecsLeft(0);
        doSubmit({ auto: true, reason: 'Time is over. Your test has been auto-submitted.' });
        return;
      }
      setSecsLeft(remaining);
      if (remaining <= WARN_5MIN_SEC && !warned5Ref.current) {
        warned5Ref.current = true;
        toast('⏰ 5 minutes remaining!', { duration: 4000, style: { background: '#f59e0b', color: '#fff', fontWeight: 700 } });
      }
      if (remaining <= WARN_1MIN_SEC && !warned1Ref.current) {
        warned1Ref.current = true;
        toast('🚨 1 minute remaining!', { duration: 5000, style: { background: '#ef4444', color: '#fff', fontWeight: 700 } });
      }
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
  }, [doSubmit]);

  /* ── Drift correction on system wake / tab restore ── */
  useEffect(() => {
    const handle = () => {
      if (!document.hidden && endAtRef.current && !submittingRef.current) {
        const remaining = Math.round((endAtRef.current - Date.now()) / 1000);
        if (remaining <= 0) {
          clearInterval(timerRef.current);
          setSecsLeft(0);
          doSubmit({ auto: true, reason: 'Time is over. Your test has been auto-submitted.' });
        } else {
          setSecsLeft(remaining);
        }
      }
    };
    document.addEventListener('visibilitychange', handle);
    return () => document.removeEventListener('visibilitychange', handle);
  }, [doSubmit]);

  /* ── Load test from server ── */
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        /* Try new startSession endpoint first (returns server-authoritative timing) */
        const r = await testAPI.startSession(sessionId);
        if (cancelled) return;
        const d = r.data;

        if (d.alreadySubmitted) {
          // Test already done — mark complete and close without showing test
          onComplete?.();
          if (d.existingResult) {
            setResult(d.existingResult);
          } else {
            onClose?.();
          }
          setLoading(false);
          return;
        }

        const questions = (d.questions || []).map(q => ({ ...q, question: q.question || q.questionText }));
        const t = { _id: d.testId, questions, durationMinutes: d.durationMinutes || 30 };
        setTest(t); testRef.current = t;

        /* Restore saved answers */
        const saved = lsGet(lsKey(d.testId, 'answers'));
        if (saved && typeof saved === 'object') { setAnswers(saved); answersRef.current = saved; }
        /* Also restore from server draft if richer */
        if (d.savedAnswers?.length) {
          const serverDraft = Object.fromEntries(d.savedAnswers.map(a => [a.questionId?.toString(), a.answer]));
          const merged = { ...serverDraft, ...(saved || {}) }; // local wins (more recent)
          setAnswers(merged); answersRef.current = merged;
        }

        /* Compute endAt */
        const savedEndAt = lsGet(lsKey(d.testId, 'endAt'));
        const endAtMs    = d.endAt ? new Date(d.endAt).getTime() : (savedEndAt || Date.now() + t.durationMinutes * 60_000);
        lsSet(lsKey(d.testId, 'endAt'), endAtMs);

        const totalSec  = t.durationMinutes * 60;
        const remaining = Math.round((endAtMs - Date.now()) / 1000);

        if (remaining <= 0) {
          endAtRef.current = endAtMs;
          doSubmit({ auto: true, reason: 'Time is over. Your test has been auto-submitted.' });
        } else {
          startTimer(endAtMs, totalSec);
        }
      } catch {
        /* Fallback to existing bySession endpoint */
        try {
          const r = await testAPI.bySession(sessionId);
          if (cancelled) return;
          const d = r.data;

          if (d.alreadySubmitted) {
            onComplete?.();
            if (d.existingResult) {
              setResult(d.existingResult);
            } else {
              onClose?.();
            }
            setLoading(false);
            return;
          }

          const questions = (d.questions || []).map(q => ({ ...q, question: q.question || q.questionText }));
          const t = { _id: d.testId, questions, durationMinutes: d.durationMinutes || 30 };
          setTest(t); testRef.current = t;

          const saved = lsGet(lsKey(d.testId, 'answers'));
          if (saved) { setAnswers(saved); answersRef.current = saved; }

          const savedEndAt = lsGet(lsKey(d.testId, 'endAt'));
          const endAtMs    = savedEndAt || Date.now() + t.durationMinutes * 60_000;
          lsSet(lsKey(d.testId, 'endAt'), endAtMs);

          const remaining = Math.round((endAtMs - Date.now()) / 1000);
          if (remaining <= 0) {
            endAtRef.current = endAtMs;
            doSubmit({ auto: true, reason: 'Time is over. Your test has been auto-submitted.' });
          } else {
            startTimer(endAtMs, t.durationMinutes * 60);
          }
        } catch (err2) {
          if (cancelled) return;
          if (err2?.response?.status === 404) setNotFound(true);
          else toast.error('Failed to load test');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [sessionId, doSubmit, startTimer]);

  /* ── Auto-save interval ── */
  useEffect(() => {
    autoSaveRef.current = setInterval(saveDraft, AUTOSAVE_MS);
    return () => clearInterval(autoSaveRef.current);
  }, [saveDraft]);

  /* ── BeforeUnload protection ── */
  useEffect(() => {
    const handle = (e) => {
      if (result || submittingRef.current) return;
      saveDraft();
      e.preventDefault();
      e.returnValue = 'Your test is in progress. Are you sure you want to leave?';
    };
    window.addEventListener('beforeunload', handle);
    return () => window.removeEventListener('beforeunload', handle);
  }, [result, saveDraft]);

  /* ── Network detection ── */
  useEffect(() => {
    const goOnline  = () => { setOffline(false); saveDraft(); toast('🌐 Back online!', { duration: 2000 }); };
    const goOffline = () => { setOffline(true);  saveDraft(); };
    window.addEventListener('online',  goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online',  goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, [saveDraft]);

  /* ── Proctoring: fullscreen exit ── */
  useEffect(() => {
    if (result) return;
    const handle = () => {
      if (document.fullscreenElement || result || submittingRef.current) return;
      setViolations(v => {
        const next = v + 1;
        if (next >= MAX_VIOLATIONS) {
          setWarning('exit-fullscreen-submit');
          doSubmit({ auto: true, reason: 'Auto-submitted: exited fullscreen too many times.' });
        } else {
          setWarning('exit-fullscreen-warn');
        }
        return next;
      });
    };
    document.addEventListener('fullscreenchange', handle);
    return () => document.removeEventListener('fullscreenchange', handle);
  }, [result, doSubmit]);

  /* ── Proctoring: tab switch ── */
  useEffect(() => {
    if (result) return;
    const handle = () => {
      if (!document.hidden || result || submittingRef.current) return;
      setViolations(v => {
        const next = v + 1;
        if (next >= MAX_VIOLATIONS) {
          setWarning('tab-switch-submit');
          doSubmit({ auto: true, reason: 'Auto-submitted: switched tabs too many times.' });
        } else {
          setWarning('tab-switch-warn');
        }
        return next;
      });
    };
    document.addEventListener('visibilitychange', handle);
    return () => document.removeEventListener('visibilitychange', handle);
  }, [result, doSubmit]);

  /* ── Handlers ── */
  const handleAnswer = useCallback((questionId, option) => {
    if (submittingRef.current || result) return;
    setAnswers(prev => {
      const next = { ...prev, [questionId]: option };
      answersRef.current = next;
      return next;
    });
  }, [result]);

  const handleManualSubmit = useCallback(() => {
    if (!test) return;
    const unanswered = test.questions.filter(q => !answersRef.current[q._id]).length;
    if (unanswered > 0) { toast.error(`Please answer all questions (${unanswered} remaining)`); return; }
    doSubmit({ auto: false });
  }, [test, doSubmit]);

  const reEnterFullscreen = useCallback(() => {
    const el = document.documentElement;
    (el.requestFullscreen || el.webkitRequestFullscreen || (() => {})).call(el).catch(() => {});
    setWarning(null);
  }, []);

  /* ── Derived ── */
  const answeredCount = test ? test.questions.filter(q => answers[q._id]).length : 0;
  const allAnswered   = test ? answeredCount === test.questions.length : false;
  const timerCritical = secondsLeft !== null && secondsLeft <= WARN_1MIN_SEC;
  const timerWarning  = secondsLeft !== null && secondsLeft <= WARN_5MIN_SEC && !timerCritical;

  /* ── Render ── */
  return (
    <div ref={containerRef} style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'linear-gradient(135deg,#0a0617 0%,#130b2b 50%,#0f0a1e 100%)',
      display: 'flex', flexDirection: 'column', overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(124,58,237,.1)', borderBottom: '1px solid rgba(124,58,237,.25)',
        padding: '12px 24px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', flexShrink: 0, gap: 16,
        backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 10,
      }}>
        {/* Left */}
        <div style={{ minWidth: 0 }}>
          <h2 style={{ color: '#fff', margin: 0, fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em' }}>
            📝 Session Test
          </h2>
          {!result && test && (
            <p style={{ color: 'rgba(255,255,255,.45)', margin: '2px 0 0', fontSize: 12 }}>
              {answeredCount}/{test.questions.length} answered
            </p>
          )}
        </div>

        {/* Center: timer */}
        {!result && secondsLeft !== null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <TimerRing secondsLeft={secondsLeft} totalSeconds={totalSeconds || 1} />
            <div>
              <p style={{
                color: timerCritical ? '#ef4444' : timerWarning ? '#f59e0b' : 'rgba(255,255,255,.5)',
                fontSize: 11, margin: 0, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase',
              }}>
                {timerCritical ? '🚨 Critical' : timerWarning ? '⏰ Warning' : 'Time Left'}
              </p>
              <p style={{
                color: timerCritical ? '#ef4444' : timerWarning ? '#f59e0b' : '#fff',
                fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: '-0.04em', transition: 'color 0.5s',
              }}>
                {fmt(secondsLeft)}
              </p>
            </div>
          </div>
        )}

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {violations > 0 && !result && (
            <span style={{
              background: 'rgba(239,68,68,.15)', color: '#fca5a5',
              fontSize: 12, padding: '4px 10px', borderRadius: 20,
              border: '1px solid rgba(239,68,68,.3)', whiteSpace: 'nowrap',
            }}>
              ⚠️ {violations}/{MAX_VIOLATIONS}
            </span>
          )}
          {offline && (
            <span style={{
              background: 'rgba(245,158,11,.15)', color: '#fbbf24',
              fontSize: 12, padding: '4px 10px', borderRadius: 20,
              border: '1px solid rgba(245,158,11,.3)',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <FiWifiOff size={11} /> Offline
            </span>
          )}
          {result && (
            <button onClick={onClose} style={{
              background: 'rgba(255,255,255,.1)', color: '#fff',
              border: '1px solid rgba(255,255,255,.2)', borderRadius: 8,
              padding: '8px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}>
              Close Test
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {!result && test && (
        <div style={{ height: 3, background: 'rgba(255,255,255,.06)', flexShrink: 0 }}>
          <div style={{
            height: '100%', width: `${(answeredCount / test.questions.length) * 100}%`,
            background: 'linear-gradient(90deg,#7c3aed,#a78bfa)',
            transition: 'width 0.4s ease',
          }} />
        </div>
      )}

      {/* Warning banner */}
      {warning && warning.includes('warn') && !result && (
        <div style={{
          background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.3)',
          margin: '16px 24px 0', padding: 16, borderRadius: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FiAlertTriangle size={18} color="#fca5a5" />
            <div>
              <p style={{ color: '#fca5a5', fontWeight: 600, margin: 0, fontSize: 14 }}>
                {warning === 'exit-fullscreen-warn' ? 'You exited fullscreen!' : 'Tab switch detected!'}
              </p>
              <p style={{ color: 'rgba(252,165,165,.7)', margin: '2px 0 0', fontSize: 12 }}>
                {MAX_VIOLATIONS - violations} more violation(s) will auto-submit the test.
              </p>
            </div>
          </div>
          <button onClick={reEnterFullscreen} style={{
            background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8,
            padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
          }}>
            <FiMaximize2 size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
            Re-enter Fullscreen
          </button>
        </div>
      )}

      {/* Offline banner */}
      {offline && !result && (
        <div style={{
          background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.3)',
          margin: '12px 24px 0', padding: '10px 16px', borderRadius: 10, flexShrink: 0,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <FiWifiOff size={15} color="#fbbf24" />
          <p style={{ color: '#fcd34d', fontSize: 13, margin: 0 }}>
            You're offline. Answers are saved locally and will sync when you reconnect.
          </p>
        </div>
      )}

      {/* Content */}
      <div style={{ flex: 1, padding: '20px 24px 40px', maxWidth: 820, margin: '0 auto', width: '100%', boxSizing: 'border-box' }}>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', paddingTop: 80 }}>
            <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4, margin: '0 auto 16px' }} />
            <p style={{ color: 'rgba(255,255,255,.5)' }}>Loading test…</p>
          </div>
        )}

        {/* Not found */}
        {notFound && (
          <div style={{ textAlign: 'center', paddingTop: 80 }}>
            <p style={{ fontSize: 48 }}>📭</p>
            <h3 style={{ color: '#fff' }}>No test for this session</h3>
            <p style={{ color: 'rgba(255,255,255,.5)' }}>This session doesn't have a test yet.</p>
            <button onClick={onClose} style={{
              background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8,
              padding: '10px 24px', cursor: 'pointer', marginTop: 16, fontSize: 14,
            }}>
              Close
            </button>
          </div>
        )}

        {/* Result screen */}
        {result && (
          <div style={{ textAlign: 'center', paddingTop: 40 }}>
            {autoSubmitted && (
              <div style={{
                background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.3)',
                borderRadius: 12, padding: '12px 20px', marginBottom: 28,
                display: 'inline-flex', alignItems: 'center', gap: 8,
              }}>
                <FiClock size={15} color="#fca5a5" />
                <span style={{ color: '#fca5a5', fontSize: 14, fontWeight: 600 }}>
                  Time is over. Your test has been auto-submitted.
                </span>
              </div>
            )}
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: result.score >= 60
                ? 'linear-gradient(135deg,#10b981,#059669)'
                : 'linear-gradient(135deg,#ef4444,#dc2626)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px', fontSize: 36,
              boxShadow: result.score >= 60
                ? '0 0 40px rgba(16,185,129,0.35)'
                : '0 0 40px rgba(239,68,68,0.35)',
            }}>
              {result.score >= 60 ? '🏆' : '😔'}
            </div>
            <h2 style={{ color: '#fff', fontSize: 42, fontWeight: 800, marginBottom: 6, letterSpacing: '-0.04em' }}>
              {result.score}%
            </h2>
            <p style={{ color: result.score >= 60 ? '#6ee7b7' : '#fca5a5', fontSize: 18, marginBottom: 28 }}>
              {result.score >= 60 ? 'Excellent work!' : 'Keep practicing!'}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 32 }}>
              <div style={{ background: 'rgba(255,255,255,.05)', borderRadius: 12, padding: 16 }}>
                <p style={{ color: 'rgba(255,255,255,.5)', fontSize: 12, margin: '0 0 4px' }}>CORRECT</p>
                <p style={{ color: '#6ee7b7', fontSize: 24, fontWeight: 700, margin: 0 }}>{result.correct ?? '-'}</p>
              </div>
              <div style={{ background: 'rgba(255,255,255,.05)', borderRadius: 12, padding: 16 }}>
                <p style={{ color: 'rgba(255,255,255,.5)', fontSize: 12, margin: '0 0 4px' }}>TOTAL</p>
                <p style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: 0 }}>{result.total ?? test?.questions?.length ?? '-'}</p>
              </div>
            </div>
            <button onClick={onClose} style={{
              background: 'linear-gradient(135deg,#7c3aed,#4c1d95)', color: '#fff',
              border: 'none', borderRadius: 10, padding: '12px 32px',
              cursor: 'pointer', fontSize: 16, fontWeight: 600,
            }}>
              Continue Learning
            </button>
          </div>
        )}

        {/* Questions */}
        {!loading && !notFound && !result && test && (
          <>
            {/* Security notice */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'rgba(124,58,237,.07)', border: '1px solid rgba(124,58,237,.18)',
              borderRadius: 10, padding: '10px 14px', marginBottom: 20,
            }}>
              <FiShield size={14} color="#a78bfa" />
              <p style={{ color: 'rgba(167,139,250,.8)', fontSize: 12, margin: 0 }}>
                This test is proctored. Exiting fullscreen or switching tabs may auto-submit your test. Answers are saved automatically.
              </p>
            </div>

            {test.questions.map((q, qi) => {
              const answered = !!answers[q._id];
              return (
                <div key={q._id} style={{
                  background: answered ? 'rgba(124,58,237,.06)' : 'rgba(255,255,255,.03)',
                  border: `1px solid ${answered ? 'rgba(124,58,237,.25)' : 'rgba(255,255,255,.07)'}`,
                  borderRadius: 14, padding: 20, marginBottom: 16, transition: 'all .2s',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, gap: 12 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flex: 1 }}>
                      <span style={{
                        background: answered ? 'rgba(124,58,237,.3)' : 'rgba(255,255,255,.08)',
                        color: answered ? '#c4b5fd' : 'rgba(255,255,255,.4)',
                        fontSize: 11, fontWeight: 800, padding: '3px 9px',
                        borderRadius: 20, flexShrink: 0, letterSpacing: '.04em', marginTop: 2,
                      }}>
                        Q{qi + 1}
                      </span>
                      <p style={{ color: '#f1f0ff', fontSize: 15, fontWeight: 500, lineHeight: 1.65, margin: 0 }}>
                        {q.question}
                      </p>
                    </div>
                    {answered && <FiCheckCircle size={16} color="#7c3aed" style={{ flexShrink: 0, marginTop: 3 }} />}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {q.options.map((opt, oi) => {
                      const isSelected = answers[q._id] === opt;
                      return (
                        <label key={oi} style={{
                          display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                          borderRadius: 10, cursor: 'pointer',
                          border: `2px solid ${isSelected ? '#7c3aed' : 'rgba(255,255,255,.08)'}`,
                          background: isSelected ? 'rgba(124,58,237,.15)' : 'transparent',
                          transition: 'all .15s', userSelect: 'none',
                        }}>
                          <input
                            type="radio" name={`q_${q._id}`} value={opt}
                            checked={isSelected}
                            onChange={() => handleAnswer(q._id, opt)}
                            style={{ display: 'none' }}
                          />
                          <div style={{
                            width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                            border: `2px solid ${isSelected ? '#7c3aed' : 'rgba(255,255,255,.3)'}`,
                            background: isSelected ? '#7c3aed' : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all .15s',
                            boxShadow: isSelected ? '0 0 8px rgba(124,58,237,.4)' : 'none',
                          }}>
                            {isSelected && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />}
                          </div>
                          <span style={{ color: isSelected ? '#fff' : 'rgba(255,255,255,.7)', fontSize: 14 }}>{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Answer summary + Submit */}
            <div style={{ marginTop: 8, marginBottom: 40 }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 12, padding: '10px 16px',
                background: 'rgba(255,255,255,.04)', borderRadius: 10,
              }}>
                <span style={{ color: 'rgba(255,255,255,.5)', fontSize: 13 }}>
                  Progress: {answeredCount} / {test.questions.length} answered
                </span>
                {allAnswered && (
                  <span style={{ color: '#6ee7b7', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <FiCheckCircle size={13} /> All answered
                  </span>
                )}
              </div>

              <button
                onClick={handleManualSubmit}
                disabled={submitting || !allAnswered}
                style={{
                  width: '100%',
                  background: allAnswered && !submitting
                    ? 'linear-gradient(135deg,#7c3aed,#4c1d95)'
                    : 'rgba(124,58,237,.2)',
                  color: '#fff', border: 'none', borderRadius: 12, padding: '16px',
                  fontSize: 16, fontWeight: 700,
                  cursor: allAnswered && !submitting ? 'pointer' : 'not-allowed',
                  transition: 'all .2s',
                  boxShadow: allAnswered && !submitting ? '0 8px 24px rgba(124,58,237,.4)' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  marginBottom: 8,
                }}
              >
                {submitting ? (
                  <>
                    <span className="spinner spinner-xs" style={{ width: 16, height: 16, borderWidth: 2 }} />
                    Submitting…
                  </>
                ) : (
                  <>
                    <FiCheckCircle size={18} />
                    Submit Test ({answeredCount}/{test.questions.length})
                  </>
                )}
              </button>

              {!allAnswered && (
                <p style={{ color: 'rgba(255,255,255,.3)', fontSize: 12, textAlign: 'center', marginTop: 4 }}>
                  Answer all {test.questions.length - answeredCount} remaining question(s) to submit.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Main LearnPage ──────────────────────────────────────── */
export default function LearnPage() {
  const { sessionId } = useParams();
  const nav = useNavigate();

  const [sessions,       setSessions]       = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [videoCompleted, setVideoCompleted] = useState(false);
  const [showTest,       setShowTest]       = useState(false);
  // testDone: seeded instantly from localStorage (so UI is correct on first render),
  // then confirmed/overridden from the backend (source of truth)
  const [testDone,       setTestDone]       = useState(() => {
    try { return localStorage.getItem(`lms_testdone_${sessionId}`) === 'true'; } catch { return false; }
  });

  const [showMarkAsReadModal, setShowMarkAsReadModal] = useState(false);
  const [markingAsRead,       setMarkingAsRead]       = useState(false);
  const [currentTime,         setCurrentTime]         = useState(0);

  // Task states
  const [task,                setTask]                = useState(null);
  const [taskSubmission,      setTaskSubmission]      = useState(null);
  const [taskCode,            setTaskCode]            = useState('');
  const [submittingTask,      setSubmittingTask]      = useState(false);

  const handleVideoCompleted = useCallback(() => setVideoCompleted(true), []);

  useEffect(() => {
    setLoading(true);
    setVideoCompleted(false);
    setShowTest(false);
    // Immediately seed from localStorage so UI shows correct state before API resolves
    try { setTestDone(localStorage.getItem(`lms_testdone_${sessionId}`) === 'true'); } catch { setTestDone(false); }
    setShowMarkAsReadModal(false);
    setTask(null);
    setTaskSubmission(null);
    setTaskCode('');

    sessionAPI.byId(sessionId)
      .then(async r => {
        const sess = r.data.session || r.data;
        setCurrentSession(sess);

        if (sess.courseId) {
          try {
            const cid = typeof sess.courseId === 'object' ? sess.courseId._id : sess.courseId;
            const sr  = await sessionAPI.byCourse(cid);
            setSessions(sr.data.sessions || sr.data || []);
          } catch {}
        }

        try {
          const vp = await api.get(`/lms/sessions/${sessionId}/video-progress`);
          if (vp.data.isCompleted) setVideoCompleted(true);
        } catch {}

        // Check test completion status from backend (permanent source of truth)
        // Uses bySession which is a read-only status check — no side effects
        try {
          const tp = await testAPI.bySession(sessionId);
          const d  = tp.data;
          // alreadySubmitted OR existingResult means the test was already done
          const done = !!(d.alreadySubmitted || d.existingResult);
          if (done) {
            setTestDone(true);
            localStorage.setItem(`lms_testdone_${sessionId}`, 'true');
          }
        } catch (err) {
          // 409 from this endpoint also means already submitted
          if (err?.response?.status === 409) {
            setTestDone(true);
            localStorage.setItem(`lms_testdone_${sessionId}`, 'true');
          }
          // Any other error: fall back to localStorage value already set above
        }

        // Check task
        try {
          const tskRes = await taskAPI.bySession(sessionId);
          if (tskRes.data.task) {
            setTask(tskRes.data.task);
            if (tskRes.data.submission) {
              setTaskSubmission(tskRes.data.submission);
              setTaskCode(tskRes.data.submission.submittedCode || '');
            }
          }
        } catch (err) {
            setTask(null);
            setTaskSubmission(null);
            setTaskCode('');
        }
      })
      .catch(() => toast.error('Failed to load session'))
      .finally(() => setLoading(false));
  }, [sessionId]);

  const handleMarkAsReadConfirm = async () => {
    setShowMarkAsReadModal(false);
    setMarkingAsRead(true);
    try {
      await api.post(`/lms/sessions/${sessionId}/video-progress`, {
        courseId,
        watchedPercent: 100,
        markedAsRead: true,
      });
      setVideoCompleted(true);
      toast.success('✅ Session marked as completed! Test is now unlocked.');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Could not mark session as completed. Please try again.');
    } finally {
      setMarkingAsRead(false);
    }
  };

  const handleTaskSubmit = async () => {
    if (!taskCode.trim()) {
      toast.error('Code cannot be empty');
      return;
    }
    setSubmittingTask(true);
    try {
      const res = await taskAPI.submit(task._id, { submittedCode: taskCode });
      toast.success('Task submitted successfully!');
      setTaskSubmission(res.data.submission);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to submit task');
    } finally {
      setSubmittingTask(false);
    }
  };

  const idx      = sessions.findIndex(s => s._id === sessionId);
  const prev     = idx > 0 ? sessions[idx - 1] : null;
  const next     = idx >= 0 && idx < sessions.length - 1 ? sessions[idx + 1] : null;
  const courseId = typeof currentSession?.courseId === 'object'
    ? currentSession?.courseId?._id
    : currentSession?.courseId;

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4, margin: '0 auto 16px' }} />
      <p style={{ color: '#6b7280' }}>Loading session…</p>
    </div>
  );

  if (!currentSession) return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <p style={{ color: '#6b7280' }}>Session not found.</p>
      <button onClick={() => nav(-1)} className="btn btn-primary" style={{ marginTop: 16 }}>Go Back</button>
    </div>
  );

  return (
    <EnrollmentGate courseId={courseId}>
      <style>{`
        @keyframes fadeIn  { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(8px);  } to { opacity: 1; transform: translateY(0); } }
        .mark-read-btn:hover    { background: rgba(124,58,237,0.12) !important; border-color: rgba(124,58,237,0.5) !important; color: #a78bfa !important; }
        .mark-read-btn:disabled { opacity: 0.5; cursor: not-allowed !important; }
      `}</style>

      {showMarkAsReadModal && (
        <MarkAsReadModal
          onConfirm={handleMarkAsReadConfirm}
          onCancel={() => setShowMarkAsReadModal(false)}
        />
      )}

      {showTest && !testDone && (
        <FullscreenTest
          sessionId={sessionId}
          onComplete={() => {
            setTestDone(true);
            // Write to localStorage as a permanent fast-path gate
            try { localStorage.setItem(`lms_testdone_${sessionId}`, 'true'); } catch {}
          }}
          onClose={() => {
            setShowTest(false);
            // If test was somehow closed after submission, re-read testDone
            try {
              if (localStorage.getItem(`lms_testdone_${sessionId}`) === 'true') setTestDone(true);
            } catch {}
          }}
        />
      )}

      <div style={{ maxWidth: '100%', margin: '0 auto', padding: '0 0 32px' }}>
        <Link
          to="/dashboard/my-courses"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            color: '#7c3aed', fontWeight: 600, fontSize: 13,
            textDecoration: 'none', marginBottom: 20,
          }}
        >
          <FiArrowLeft size={16} /> Back to My Courses
        </Link>

        {/* Video + info card */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
          <VideoPlayer
            url={currentSession.videoUrl || currentSession.videoLink || currentSession.videoDriveLink}
            sessionId={sessionId}
            onCompleted={handleVideoCompleted}
            isAlreadyCompleted={videoCompleted}
            onTimeUpdate={setCurrentTime}
          />

          <div style={{ padding: '20px 18px' }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#1a0e35', marginBottom: 8 }}>
              {currentSession.sessionTitle || currentSession.title}
            </h1>
            {currentSession.videoTitle && (
              <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 12 }}>📹 {currentSession.videoTitle}</p>
            )}
            {currentSession.description && (
              <p style={{ color: '#6b7280', fontSize: 14, lineHeight: 1.7 }}>{currentSession.description}</p>
            )}

            {/* Mark as Read button */}
            {!videoCompleted && (
              <div style={{
                marginTop: 16, paddingTop: 16,
                borderTop: '1px solid rgba(124,58,237,0.1)',
                display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
                animation: 'slideUp 0.3s ease',
              }}>
                <button
                  className="mark-read-btn"
                  disabled={markingAsRead}
                  onClick={() => setShowMarkAsReadModal(true)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '9px 18px',
                    background: 'rgba(124,58,237,0.07)',
                    border: '1px solid rgba(124,58,237,0.3)',
                    borderRadius: 9, color: '#7c3aed',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    transition: 'all 0.18s ease',
                  }}
                >
                  {markingAsRead ? (
                    <><span className="spinner spinner-xs" style={{ width: 14, height: 14, borderWidth: 2 }} /> Saving…</>
                  ) : (
                    <><FiBookOpen size={15} /> Mark as Read</>
                  )}
                </button>
                <span style={{ color: '#9ca3af', fontSize: 12 }}>
                  Already reviewed this content? Mark it as complete manually.
                </span>
              </div>
            )}

            {/* Completed badge */}
            {videoCompleted && (
              <div style={{
                marginTop: 16, paddingTop: 16,
                borderTop: '1px solid rgba(16,185,129,0.15)',
                display: 'flex', alignItems: 'center', gap: 8,
                animation: 'slideUp 0.3s ease',
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <FiCheckCircle size={14} color="#10b981" />
                </div>
                <span style={{ color: '#059669', fontSize: 13, fontWeight: 600 }}>
                  Session completed — test is unlocked
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Video Notes */}
        <VideoNotes 
          sessionId={sessionId} 
          currentTime={currentTime} 
          isDrive={!!toEmbed(currentSession.videoUrl || currentSession.videoLink || currentSession.videoDriveLink)} 
        />

        {/* Discussion Forum */}
        <div style={{ marginBottom: 16 }}>
          <DiscussionForum 
            courseId={courseId} 
            sessionId={sessionId} 
            userRole="student" 
          />
        </div>

        {/* Task Section */}
        {task && (
          <div className="card" style={{ padding: '20px 18px', marginBottom: 16 }}>
            <h3 style={{
              fontSize: 16, fontWeight: 700, color: '#1a0e35', marginBottom: 12,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              {videoCompleted
                ? <FiUnlock size={18} color="#10b981" />
                : <FiLock   size={18} color="#9ca3af" />}
              Task: {task.title}
            </h3>

            {videoCompleted ? (
              <div style={{ animation: 'slideUp 0.3s ease' }}>
                <p style={{ fontSize: 14, color: '#374151', marginBottom: 8 }}>{task.description}</p>
                {task.instructions && (
                  <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, fontSize: 13, color: '#475569', marginBottom: 16, whiteSpace: 'pre-wrap' }}>
                    {task.instructions}
                  </div>
                )}
                {taskSubmission && (
                  <div style={{
                    background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                    border: '1.5px solid #86efac',
                    borderRadius: 12, padding: '16px 18px',
                    display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
                    }}>
                      <FiCheckCircle size={18} color="#fff" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: '#15803d', fontSize: 14, fontWeight: 700, margin: '0 0 4px' }}>Task Submitted</p>
                      <p style={{ color: '#166534', fontSize: 13, margin: 0, lineHeight: 1.5 }}>
                        You've submitted your code. You can update it by submitting again.
                      </p>
                      {taskSubmission.feedback && (
                        <div style={{
                          marginTop: 12, padding: 12, background: 'rgba(255,255,255,0.6)',
                          borderRadius: 8, border: '1px solid rgba(21,128,61,0.2)'
                        }}>
                          <p style={{ fontSize: 12, fontWeight: 700, color: '#15803d', marginBottom: 4 }}>Tutor Feedback:</p>
                          <p style={{ fontSize: 13, color: '#166534', margin: 0, whiteSpace: 'pre-wrap' }}>{taskSubmission.feedback}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 13, fontWeight: 600 }}>Your Code Submission</label>
                  <textarea
                    value={taskCode}
                    onChange={e => setTaskCode(e.target.value)}
                    placeholder="Write or paste your code here..."
                    rows={8}
                    style={{
                      fontFamily: 'monospace', fontSize: 13, background: '#0f172a', color: '#e2e8f0',
                      padding: 16, borderRadius: 12, resize: 'vertical', width: '100%',
                      border: '1px solid #334155'
                    }}
                  />
                </div>
                <button
                  onClick={handleTaskSubmit}
                  disabled={submittingTask}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                >
                  {submittingTask ? <><span className="spinner spinner-xs" /> Submitting...</> : <><FiCheckCircle size={16} /> Submit Task</>}
                </button>
              </div>
            ) : (
              <div style={{
                background: '#faf5ff', border: '1px solid #ddd6fe',
                borderRadius: 10, padding: 14,
                display: 'flex', alignItems: 'flex-start', gap: 10,
              }}>
                <FiLock size={15} color="#7c3aed" style={{ marginTop: 1, flexShrink: 0 }} />
                <p style={{ color: '#6d28d9', fontSize: 14, margin: 0 }}>
                  Complete the video above to unlock the coding task.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Test Access Section */}
        <div className="card" style={{ padding: '20px 18px', marginBottom: 16 }}>
          <h3 style={{
            fontSize: 16, fontWeight: 700, color: '#1a0e35', marginBottom: 12,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            {videoCompleted
              ? <FiUnlock size={18} color="#10b981" />
              : <FiLock   size={18} color="#9ca3af" />}
            Session Test
          </h3>

          {videoCompleted ? (
            <div style={{ animation: 'slideUp 0.3s ease' }}>
              {testDone ? (
                <div style={{
                  background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                  border: '1.5px solid #86efac',
                  borderRadius: 12, padding: '16px 18px',
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
                  }}>
                    <FiCheckCircle size={18} color="#fff" />
                  </div>
                  <div>
                    <p style={{ color: '#15803d', fontSize: 14, fontWeight: 700, margin: '0 0 4px' }}>
                      Test Completed
                    </p>
                    <p style={{ color: '#166534', fontSize: 13, margin: 0, lineHeight: 1.5 }}>
                      You've already submitted this test. Check your progress page to view your score and results.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <p style={{ color: '#059669', fontSize: 14, marginBottom: 16 }}>
                    ✅ Session completed! You can now take the test.
                  </p>
                  <button
                    onClick={() => { if (!testDone) setShowTest(true); }}
                    className="btn btn-primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                  >
                    <FiPlay size={16} /> Start Test (Fullscreen Mode)
                  </button>
                </>
              )}
            </div>
          ) : (
            <div style={{
              background: '#faf5ff', border: '1px solid #ddd6fe',
              borderRadius: 10, padding: 14,
              display: 'flex', alignItems: 'flex-start', gap: 10,
            }}>
              <FiLock size={15} color="#7c3aed" style={{ marginTop: 1, flexShrink: 0 }} />
              <p style={{ color: '#6d28d9', fontSize: 14, margin: 0 }}>
                Complete the video above <strong>or click "Mark as Read"</strong> to unlock this session's test.
                Your progress is saved automatically.
              </p>
            </div>
          )}
        </div>

        {/* Session Navigation */}
        {(prev || next) && (
          <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
            {prev ? (
              <button
                onClick={() => nav(`/dashboard/learn/${prev._id}`)}
                className="btn btn-ghost"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
              >
                <FiChevronLeft size={16} />
                {prev.sessionTitle || prev.title}
              </button>
            ) : <div />}

            {next ? (
              <button
                onClick={() => nav(`/dashboard/learn/${next._id}`)}
                className="btn btn-primary"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  whiteSpace: 'nowrap', width: 'fit-content',
                  padding: '8px 16px', alignSelf: 'center',
                }}
              >
                Next Session
                <FiChevronRight size={16} />
              </button>
            ) : <div />}
          </div>
        )}
      </div>

      <AICopilotDrawer 
        courseId={courseId} 
        sessionId={sessionId} 
        sessionTitle={currentSession?.sessionTitle || currentSession?.title} 
      />
    </EnrollmentGate>
  );
}