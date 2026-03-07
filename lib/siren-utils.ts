
let audioContext: AudioContext | null = null;
let oscillator: OscillatorNode | null = null;
let gainNode: GainNode | null = null;

export async function playSiren(durationSeconds: number = 30) {
    if (typeof window === 'undefined') return;

    try {
        if (!audioContext) {
            audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }

        // Stop existing if any
        stopSirenInternal();

        oscillator = audioContext.createOscillator();
        gainNode = audioContext.createGain();

        oscillator.type = 'triangle';

        const now = audioContext.currentTime;
        // Repeating siren effect
        for (let i = 0; i < durationSeconds; i++) {
            oscillator.frequency.setValueAtTime(440, now + i);
            oscillator.frequency.exponentialRampToValueAtTime(880, now + i + 0.5);
            oscillator.frequency.exponentialRampToValueAtTime(440, now + i + 1);
        }

        gainNode.gain.setValueAtTime(0.2, now); // Slightly louder for test/emergency

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.start();

        return true;
    } catch (e) {
        console.error("Siren Playback Error:", e);
        return false;
    }
}

export function stopSirenInternal() {
    if (oscillator) {
        try {
            oscillator.stop();
            oscillator.disconnect();
            oscillator = null;
        } catch (e) { }
    }
    if (gainNode) {
        try {
            gainNode.disconnect();
            gainNode = null;
        } catch (e) { }
    }
}
