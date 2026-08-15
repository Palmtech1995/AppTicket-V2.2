/**
 * ============================================================================
 * [MODULE: SOUND NOTIFICATION SYNTHESIZER]
 * File: /src/utils/sound.ts
 * Description: Web Audio API Synthesizer for Realtime Notification Chimes
 * ============================================================================
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!audioCtx && AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch (err) {
    console.warn('Web Audio API not supported or blocked:', err);
    return null;
  }
}

/**
 * Play a high-quality, pleasant two-tone notification chime for new tickets
 */
export function playTicketNotificationSound(priority?: string) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Gain node for smooth volume envelope
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.connect(ctx.destination);

    // Urgent vs Standard frequency notes
    const isUrgent = priority === 'URGENT' || priority === 'HIGH';
    const notes = isUrgent
      ? [
          { freq: 659.25, time: 0, dur: 0.12 }, // E5
          { freq: 880.0, time: 0.12, dur: 0.14 }, // A5
          { freq: 1174.66, time: 0.26, dur: 0.28 }, // D6
        ]
      : [
          { freq: 523.25, time: 0, dur: 0.14 }, // C5
          { freq: 659.25, time: 0.12, dur: 0.16 }, // E5
          { freq: 783.99, time: 0.26, dur: 0.28 }, // G5
        ];

    masterGain.gain.setValueAtTime(0.18, now);
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    notes.forEach((n) => {
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.freq, now + n.time);

      noteGain.gain.setValueAtTime(0.001, now + n.time);
      noteGain.gain.exponentialRampToValueAtTime(0.2, now + n.time + 0.02);
      noteGain.gain.exponentialRampToValueAtTime(0.001, now + n.time + n.dur);

      osc.connect(noteGain);
      noteGain.connect(masterGain);

      osc.start(now + n.time);
      osc.stop(now + n.time + n.dur + 0.05);
    });
  } catch (err) {
    console.warn('Could not play notification sound:', err);
  }
}

/**
 * Request Desktop / Browser Notification Permission
 */
export async function requestBrowserNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  if (Notification.permission !== 'denied') {
    return await Notification.requestPermission();
  }
  return Notification.permission;
}

/**
 * Send a native browser Desktop Notification
 */
export function sendDesktopNotification(title: string, options?: NotificationOptions) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options,
      });
    } catch (e) {
      console.warn('Desktop notification error:', e);
    }
  }
}
