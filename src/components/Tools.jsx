import {useEffect, useRef, useState} from "react";
import {useGSAP} from "@gsap/react";
import gsap from "gsap";
import {MotionPathPlugin} from "gsap/MotionPathPlugin";
import {toolGroups} from "../constants";
import SectionTitle from "./SectionTitle.jsx";
import useInView from "../hooks/useInView.js";
import {clamp} from "../lib/physics.js";

gsap.registerPlugin(MotionPathPlugin);

const COLORS = ['#d97706', '#8b5cf6', '#3b82f6', '#10b981', '#14b8a6', '#e11d48'];   // one luggage colour per carousel
const SPEED = 60;               // belt speed, px per second
const AUTO_MS = 9000;           // the carousel changes by itself this often, until you take over

// The geometry of the belt: a stadium (a rectangle with round ends). Wide screens get a horizontal oval with an
// island in the middle for the item card; phones get an upright oval with the card underneath.
const geometry = (W) => {
    const vertical = W < 900;
    const s = vertical ? clamp(W / 480, 0.72, 0.9) : clamp(W / 1100, 0.75, 1);
    const bw = (vertical ? 92 : 112) * s;        // belt width
    const m = 12;                                // margin around the belt
    let R, x0, x1, xL, xR, yTop, yBot, height;

    if (vertical) {
        xL = m + bw / 2;
        xR = W - m - bw / 2;
        R = (xR - xL) / 2;
        yTop = m + bw / 2 + R;
        yBot = yTop + 230;
        height = yBot + R + bw / 2 + m;
    } else {
        R = clamp(W * 0.17, 120, 200);
        x0 = m + bw / 2 + R;
        x1 = W - m - bw / 2 - R;
        yTop = m + bw / 2;
        yBot = yTop + 2 * R;
        height = yBot + bw / 2 + m;
    }

    // a stadium outline, grown (off > 0) or shrunk (off < 0) from the belt's centre line
    const stadium = (off) => (vertical
        ? `M${xL - off} ${yTop} A${R + off} ${R + off} 0 0 1 ${xR + off} ${yTop} V${yBot} A${R + off} ${R + off} 0 0 1 ${xL - off} ${yBot} Z`
        : `M${x0} ${yTop - off} H${x1} A${R + off} ${R + off} 0 0 1 ${x1} ${yBot + off} H${x0} A${R + off} ${R + off} 0 0 1 ${x0} ${yTop - off} Z`);

    // the island in the middle of a horizontal belt
    let island = null;
    if (!vertical) {
        const rIn = R - bw / 2;
        const w = x1 - x0 + 2 * 0.35 * rIn;
        const h = 2 * (rIn - 22);
        island = { left: (x0 + x1) / 2 - w / 2, top: yTop + R - h / 2, width: w, height: h };
    }

    return { W, vertical, s, bw, height, center: stadium(0), outer: stadium(bw / 2 + 8), rimA: stadium(bw / 2), rimB: stadium(-bw / 2), island, key: [W, vertical].join('|') };
};

// Tools, as a baggage claim: six carousels (one per group), each with its tools riding round as luggage.
// Hover a bag and the belt eases to a stop so you can read its tag; the island shows the joke.
const Tools = () => {
    const [shellRef, inView] = useInView(0.2);
    const stageRef = useRef(null);
    const tlRef = useRef(null);
    const touched = useRef(false);
    const [width, setWidth] = useState(0);
    const [cat, setCat] = useState(0);
    const [sel, setSel] = useState(0);

    const group = toolGroups[cat];
    const tools = group.tools;
    const tool = tools[Math.min(sel, tools.length - 1)];
    const geo = width ? geometry(width) : null;

    // measure the stage; the belt is redrawn when its width changes (rotating a phone, resizing the window)
    useEffect(() => {
        const el = stageRef.current;
        const measure = () => setWidth(Math.round(el.clientWidth));
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    const choose = (i, byUser) => {
        if (byUser) touched.current = true;
        setCat(i);
        setSel(0);
    };

    // until you touch anything, the carousels take turns
    useEffect(() => {
        if (!inView) return;
        const id = setInterval(() => {
            if (touched.current || document.hidden) return;
            setCat((c) => (c + 1) % toolGroups.length);
            setSel(0);
        }, AUTO_MS);
        return () => clearInterval(id);
    }, [inView]);

    // every bag rides the same belt: one tween each along the path, offset around it, all inside one timeline
    // so the whole belt can be slowed or stopped at once
    useGSAP(() => {
        if (!geo) return;
        const path = stageRef.current.querySelector('.belt-path');
        const slats = stageRef.current.querySelector('.belt-slats');
        const bags = gsap.utils.toArray('.bag', stageRef.current);
        const len = path.getTotalLength();
        const tl = gsap.timeline();

        // each bag starts at its own point on the loop (start..start+1 wraps all the way round the closed path)
        bags.forEach((el, i) => {
            const from = i / bags.length;
            tl.add(gsap.to(el, {
                motionPath: { path, align: path, alignOrigin: [0.5, 0.5], start: from, end: from + 1 },
                duration: len / SPEED,
                ease: 'none',
                repeat: -1,
            }), 0);
        });

        // the belt's own slats move at the same speed
        const pattern = 30 * geo.s;
        const k = Math.max(1, Math.round(len / pattern));
        tl.add(gsap.fromTo(slats, { strokeDashoffset: 0 }, { strokeDashoffset: -k * pattern, duration: (k * pattern) / SPEED, ease: 'none', repeat: -1 }), 0);

        tlRef.current = tl;
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduced) tl.timeScale(0);
        else gsap.fromTo(tl, { timeScale: 6 }, { timeScale: 1, duration: 1.6, ease: 'power3.out' });   // new bags arrive fast, then settle
        return () => { tlRef.current = null; };
    }, { scope: stageRef, dependencies: [cat, geo?.key], revertOnUpdate: true });

    const setBelt = (speed) => {
        if (tlRef.current) gsap.to(tlRef.current, { timeScale: speed, duration: 0.3, overwrite: true });
    };
    const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pause = (i) => { setSel(i); touched.current = true; setBelt(0); };
    const resume = () => { if (!reduced) setBelt(1); };

    const color = COLORS[cat];

    return (
        <section id="tools">
            <SectionTitle lines={['Tools', 'I reach for']} />

            <div className={`claim${inView ? ' in' : ''}`} ref={shellRef} data-reveal>
                <div className="claim-tabs" role="tablist" aria-label="Carousels">
                    {toolGroups.map((g, i) => (
                        <button
                            key={g.title}
                            type="button"
                            role="tab"
                            aria-selected={cat === i}
                            className={cat === i ? 'on' : ''}
                            onClick={() => choose(i, true)}
                        >
                            <i>{i + 1}</i> {g.title}
                        </button>
                    ))}
                </div>

                <div className="claim-stage" ref={stageRef} style={geo ? { height: geo.height, '--s': geo.s, '--bc': color } : undefined}>
                    {geo && (
                        <>
                            <svg className="belt" width={geo.W} height={geo.height} aria-hidden="true">
                                <path className="belt-outer" d={geo.outer} />
                                <path className="belt-rim" d={geo.rimA} />
                                <path className="belt-rim" d={geo.rimB} />
                                <path className="belt-path" d={geo.center} style={{ strokeWidth: geo.bw }} />
                                <path className="belt-slats" d={geo.center} style={{ strokeWidth: geo.bw, strokeDasharray: `${3 * geo.s} ${27 * geo.s}` }} />
                            </svg>

                            {tools.map((t, i) => (
                                <button
                                    key={`${cat}-${t.id}`}
                                    type="button"
                                    className={`bag${sel === i ? ' on' : ''}`}
                                    aria-label={`${t.name}. ${t.lore}`}
                                    onPointerEnter={() => pause(i)}
                                    onPointerLeave={resume}
                                    onFocus={() => pause(i)}
                                    onBlur={resume}
                                    onClick={() => { setSel(i); touched.current = true; }}
                                >
                                    <span className="bag-in" style={{ animationDelay: `${i * 70}ms` }}>
                                        <span className="bag-handle" />
                                        <span className="bag-body"><b>{t.code}</b></span>
                                        <span className="bag-tag">{t.label || t.name}</span>
                                    </span>
                                </button>
                            ))}

                            {geo.island && (
                                <div className="claim-island" style={geo.island}>
                                    <div className="card" key={tool.id} aria-live="polite">
                                        <p className="where">Carousel {cat + 1} · {group.title}</p>
                                        <h3>{tool.name}</h3>
                                        <p className="lore">“{tool.lore}”</p>
                                        <p className="count">Bag {Math.min(sel, tools.length - 1) + 1} of {tools.length}</p>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {geo && !geo.island && (
                    <div className="claim-card">
                        <div className="card" key={tool.id} aria-live="polite">
                            <p className="where">Carousel {cat + 1} · {group.title}</p>
                            <h3>{tool.name}</h3>
                            <p className="lore">“{tool.lore}”</p>
                            <p className="count">Bag {Math.min(sel, tools.length - 1) + 1} of {tools.length}</p>
                        </div>
                    </div>
                )}

                <p className="claim-hint">Hover a bag to stop the belt and read its tag.</p>
            </div>
        </section>
    )
}
export default Tools
