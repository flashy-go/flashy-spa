import React, { useState, useEffect, useRef } from 'react';

function PriorityAccessForm() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [recordId, setRecordId] = useState(null);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [downloadEnabled, setDownloadEnabled] = useState(false);
  const intervalRef = useRef(null);

  const PLAY_STORE_URL = 'https://play.google.com/apps/testing/com.flashygo.app';

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function validateEmail(value) {
    if (!value) {
      setEmailError('El correo electrónico es requerido.');
      return false;
    }
    const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(value)) {
      setEmailError('Por favor ingresa un correo electrónico válido.');
      return false;
    }
    setEmailError('');
    return true;
  }

  function handleEmailChange(e) {
    const value = e.target.value;
    setEmail(value);
    if (emailError) validateEmail(value);
  }

  function startCountdown() {
    setCountdown(60);
    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setDownloadEnabled(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validateEmail(email)) return;

    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/launch-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al enviar');
      }

      setRecordId(data.id);
      setSubmitted(true);
      startCountdown();
    } catch (err) {
      setError(err.message || 'Hubo un problema al enviar. Por favor intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDownload() {
    if (!downloadEnabled || !recordId) return;

    try {
      await fetch('/api/launch-users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: recordId }),
      });
    } catch (err) {
      console.error('Error updating registered status:', err);
    }

    window.open(PLAY_STORE_URL, '_blank');
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (submitted) {
    return (
      <div className="w-full space-y-6">
        {/* Success message */}
        <div className="rounded-xl p-5 border border-green-500/30" style={{
          background: 'linear-gradient(135deg, rgba(34,197,94,0.1) 0%, rgba(34,197,94,0.03) 100%)',
        }}>
          <div className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-green-400 text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
            <h3 className="font-headline font-bold text-lg text-green-400">¡Correo registrado!</h3>
          </div>
          <p className="text-green-300/80 text-sm pl-9">{email}</p>
        </div>

        {/* Steps to become a tester */}
        <div className="rounded-xl p-6 bg-surface-container-high border border-outline-variant/20">
          <h4 className="font-headline font-bold text-base text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">checklist</span>
            Pasos para acceder a la App
          </h4>
          <div className="space-y-4">
            {/* Step 1 */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
                <span className="font-headline font-black text-xs text-primary">1</span>
              </div>
              <div>
                <p className="text-on-surface text-sm font-semibold">
                  Dar click en <span className="text-primary font-bold">"Become a tester"</span> o <span className="text-primary font-bold">"Conviértete en probador"</span>
                </p>
                <p className="text-on-surface-variant text-xs mt-0.5">Acepta ser parte del programa de pruebas.</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
                <span className="font-headline font-black text-xs text-primary">2</span>
              </div>
              <div>
                <p className="text-on-surface text-sm font-semibold">
                  Dar click en el link <span className="text-primary font-bold">"Descárgala en Google Play"</span>
                </p>
                <p className="text-on-surface-variant text-xs mt-0.5">Serás redirigido a la Play Store.</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
                <span className="font-headline font-black text-xs text-primary">3</span>
              </div>
              <div>
                <p className="text-on-surface text-sm font-semibold">
                  Descarga la app y comienza a usarla
                </p>
                <p className="text-on-surface-variant text-xs mt-0.5">¡Disfruta de Flashy!</p>
              </div>
            </div>
          </div>
        </div>

        {/* Download button with countdown */}
        <div className="text-center">
          {!downloadEnabled && (
            <div className="mb-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container-highest border border-outline-variant/20">
                <span className="material-symbols-outlined text-primary text-lg animate-spin" style={{ animationDuration: '3s' }}>hourglass_top</span>
                <span className="font-headline font-bold text-sm text-on-surface-variant">
                  Disponible en <span className="text-primary font-black tabular-nums">{formatTime(countdown)}</span>
                </span>
              </div>
            </div>
          )}

          <button
            onClick={handleDownload}
            disabled={!downloadEnabled}
            className={`w-full py-4 rounded-lg font-headline font-black text-lg uppercase tracking-widest transition-all transform active:scale-[0.98] shadow-lg
              ${downloadEnabled
                ? 'bg-gradient-to-br from-green-500 to-green-600 text-white hover:from-green-400 hover:to-green-500 shadow-green-500/25 cursor-pointer'
                : 'bg-surface-container-highest text-on-surface-variant/40 cursor-not-allowed border border-outline-variant/20'
              }`}
          >
            <span className="flex items-center justify-center gap-2">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                {downloadEnabled ? 'download' : 'lock'}
              </span>
              {downloadEnabled ? 'Descargar la App' : 'Descargar la App'}
            </span>
          </button>

          {/* Progress bar */}
          {!downloadEnabled && (
            <div className="mt-3 w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary-container rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${((60 - countdown) / 60) * 100}%` }}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <form className="w-full space-y-5" onSubmit={handleSubmit} noValidate>
      {/* Important notice */}
      <div className="rounded-xl p-5 border border-primary/20" style={{
        background: 'linear-gradient(135deg, rgba(255,145,90,0.08) 0%, rgba(255,145,90,0.02) 100%)',
      }}>
        <div className="flex items-start gap-3">
          <span className="material-symbols-outlined text-primary text-xl flex-shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
          <div>
            <h4 className="font-headline font-bold text-sm text-primary uppercase tracking-wider mb-2">Importante</h4>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              El correo que ingrese acá debe ser el correo vinculado a su dispositivo y cuenta de <strong className="text-on-surface font-bold">Play Store</strong>. Una vez ingresado el correo, espere un minuto para acceder a la App en el botón que aparecerá.
            </p>
          </div>
        </div>
      </div>

      {/* Email input */}
      <div className="space-y-1.5">
        <label className="text-[10px] uppercase font-black text-primary tracking-widest px-1" htmlFor="priority-email">
          Correo Electrónico
        </label>
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-xl">mail</span>
          <input
            id="priority-email"
            className={`w-full bg-surface-container-high border-2 focus:ring-2 focus:ring-primary/30 rounded-lg text-on-surface pl-10 pr-4 py-3.5 placeholder:text-on-surface-variant/30 outline-none transition-all ${
              emailError ? 'border-error' : 'border-transparent focus:border-primary/40'
            }`}
            placeholder="tucorreo@gmail.com"
            type="email"
            name="email"
            value={email}
            onChange={handleEmailChange}
            onBlur={() => email && validateEmail(email)}
            required
            autoComplete="email"
          />
        </div>
        {emailError && (
          <div className="flex items-center gap-1.5 px-1">
            <span className="material-symbols-outlined text-error text-xs">error</span>
            <p className="text-error text-xs">{emailError}</p>
          </div>
        )}
      </div>

      {/* General error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-error/10 border border-error/30">
          <span className="material-symbols-outlined text-error text-lg">error</span>
          <p className="text-error text-sm">{error}</p>
        </div>
      )}

      {/* Submit button */}
      <button
        className="w-full py-4 bg-gradient-to-br from-primary to-primary-container text-on-primary-fixed font-headline font-black text-lg uppercase tracking-widest rounded-lg transition-all transform active:scale-[0.98] shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_30px_rgba(255,145,90,0.3)]"
        type="submit"
        disabled={submitting || !email}
      >
        <span className="flex items-center justify-center gap-2">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            {submitting ? 'progress_activity' : 'send'}
          </span>
          {submitting ? 'Enviando...' : 'Enviar'}
        </span>
      </button>
    </form>
  );
}

export default PriorityAccessForm;
