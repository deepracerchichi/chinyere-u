import {useEffect, useRef, useState} from "react";
import gsap from "gsap";
import {experience} from "../constants";
import SectionTitle from "./SectionTitle.jsx";
import FlapField from "./FlapField.jsx";
import {CHARS, flipTo, makeCell, showNow} from "../lib/flap.js";

const COLS = { from: 6, org: 12, job: 16, status: 7 };

// Experience as an airport departures board: each job is a flight, the letters flip into place when it scrolls in,
// and clicking a row opens its "boarding pass" with what you did there.
const Experience = () => {
    const boardRef = useRef(null);
    const [open, setOpen] = useState(1);

    useEffect(() => {
        const board = boardRef.current;
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        const fields = new Map();
        board.querySelectorAll('.field').forEach((el) => {
            fields.set(el, [...el.querySelectorAll('.cell')].map(makeCell));
        });

        const setField = (el, text, delay = 0) => {
            const cells = fields.get(el);
            const padded = text.toUpperCase().padEnd(cells.length, ' ').slice(0, cells.length);
            cells.forEach((cell, k) => {
                if (reduced) showNow(cell, padded[k]);
                else flipTo(cell, padded[k], delay + k * 26 + Math.random() * 60);
            });
        };

        const clock = () => {
            const d = new Date();
            return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        };
        const clockEl = board.querySelector('[data-field="clock"]');
        const titleEl = board.querySelector('[data-field="title"]');

        let started = false;
        const start = () => {
            if (started) return;
            started = true;
            setField(titleEl, titleEl.dataset.target, 0);
            setField(clockEl, clock(), 200);
            board.querySelectorAll('.frow').forEach((row, r) => {
                row.querySelectorAll('.field').forEach((el) => setField(el, el.dataset.target, 350 + r * 160));
            });
        };

        const io = new IntersectionObserver(([entry]) => entry.isIntersecting && start(), { threshold: 0.2 });
        io.observe(board);

        // the clock ticks; now and then a random flight "re-checks" itself
        const tick = setInterval(() => setField(clockEl, clock()), 20000);
        const shimmer = setInterval(() => {
            if (!started || reduced || document.hidden) return;
            const rows = [...board.querySelectorAll('.frow')];
            const el = rows[Math.floor(Math.random() * rows.length)].querySelector('[data-field="org"]');
            fields.get(el).forEach((cell, k) => flipTo(cell, CHARS[1 + Math.floor(Math.random() * 26)], k * 20));
            setTimeout(() => setField(el, el.dataset.target), 900);
        }, 7000);

        // hovering a row flips its status to DETAILS
        const cleanups = [...board.querySelectorAll('.frow')].map((row) => {
            const st = row.querySelector('[data-field="status"]');
            const enter = () => setField(st, 'DETAILS');
            const leave = () => setField(st, st.dataset.target);
            row.addEventListener('mouseenter', enter);
            row.addEventListener('mouseleave', leave);
            row.addEventListener('focus', enter);
            row.addEventListener('blur', leave);
            return () => {
                row.removeEventListener('mouseenter', enter);
                row.removeEventListener('mouseleave', leave);
                row.removeEventListener('focus', enter);
                row.removeEventListener('blur', leave);
            };
        });

        return () => {
            io.disconnect();
            clearInterval(tick);
            clearInterval(shimmer);
            cleanups.forEach((fn) => fn());
            gsap.killTweensOf('.flap');
        };
    }, []);

    return (
        <section id="experience">
            <SectionTitle lines={['Where', "I've", 'worked']} count={experience.filter((e) => !e.education).length} />

            <div className="board" ref={boardRef}>
                <div className="board-head">
                    <FlapField name="title" len={10} target="DEPARTURES" />
                    <FlapField name="clock" len={5} target="00:00" />
                </div>

                <div className="board-cols" aria-hidden="true">
                    <span className="col-from">From</span>
                    <span className="col-org">Where</span>
                    <span className="col-job">Role</span>
                    <span className="col-status">Status</span>
                </div>

                {experience.map((e) => (
                    <div key={e.id} className={`xrow${open === e.id ? ' open' : ''}`}>
                        <button
                            type="button"
                            className="frow"
                            data-st={e.status}
                            aria-expanded={open === e.id}
                            aria-controls={`pass-${e.id}`}
                            aria-label={`${e.role}, ${e.company}, ${e.period}`}
                            onClick={() => setOpen(open === e.id ? 0 : e.id)}
                        >
                            <FlapField name="from" len={COLS.from} target={e.from} />
                            <FlapField name="org" len={COLS.org} target={e.org} />
                            <FlapField name="job" len={COLS.job} target={e.job} />
                            <FlapField name="status" len={COLS.status} target={e.status} />
                        </button>

                        <div className="pass" id={`pass-${e.id}`}>
                            <div className="pass-inner">
                                <h3>{e.role}, {e.company}</h3>
                                <p className="period">{e.period}</p>
                                <ul className="bullets">
                                    {e.bullets.map((b) => <li key={b}>{b}</li>)}
                                </ul>
                                {e.tags.length > 0 && (
                                    <ul className="tags">
                                        {e.tags.map((tag) => <li key={tag}>{tag}</li>)}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    )
}
export default Experience
