import {useEffect, useRef, useState} from "react";

const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const rnd = (c) => (/[A-Z]/.test(c) ? UPPER[(Math.random() * 26) | 0] : /[a-z]/.test(c) ? LOWER[(Math.random() * 26) | 0] : c);

// Intro screen: the name scrambles, then decodes letter by letter, then the screen lifts away.
const Boot = ({ name, role, onDone }) => {
    const nameRef = useRef(null);
    const [leaving, setLeaving] = useState(false);
    const [gone, setGone] = useState(false);
    const doneRef = useRef(false);

    useEffect(() => {
        const finish = () => {
            if (doneRef.current) return;
            doneRef.current = true;
            onDone();
        };

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            finish();
            setGone(true);
            return;
        }

        const text = name.toLowerCase();
        const el = nameRef.current;
        el.textContent = '';
        const spans = [...text].map((ch) => {
            const s = document.createElement('span');
            s.textContent = ch === ' ' ? ' ' : rnd(ch);
            if (ch !== ' ') s.className = 'scrambling';
            el.appendChild(s);
            return s;
        });

        let raf = 0;
        const timers = [];
        const start = performance.now();
        const DUR = 800;

        const tick = (now) => {
            const p = Math.min((now - start) / DUR, 1);
            const lock = Math.floor(p * text.length);
            spans.forEach((s, i) => {
                if (text[i] === ' ') return;
                if (i < lock) {
                    s.textContent = text[i];
                    s.className = '';
                } else if (Math.random() < 0.6) {
                    s.textContent = rnd(text[i]);
                }
            });
            if (p < 1) {
                raf = requestAnimationFrame(tick);
            } else {
                spans.forEach((s, i) => { if (text[i] !== ' ') { s.textContent = text[i]; s.className = ''; } });
                timers.push(setTimeout(() => { setLeaving(true); finish(); }, 350));
                timers.push(setTimeout(() => setGone(true), 1100));
            }
        };
        raf = requestAnimationFrame(tick);

        // never trap the visitor behind the intro
        timers.push(setTimeout(() => { setLeaving(true); finish(); setGone(true); }, 4000));

        return () => {
            cancelAnimationFrame(raf);
            timers.forEach(clearTimeout);
        };
    }, [name, onDone]);

    if (gone) return null;

    return (
        <div className={`boot${leaving ? ' leaving' : ''}`} aria-hidden="true">
            <div className="boot-name" ref={nameRef} />
            <div className="boot-role">{role}</div>
        </div>
    )
}
export default Boot
