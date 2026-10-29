import {useRef} from "react";
import {heroKeys} from "../constants";
import {Verlet, clamp, localPoint, useSim} from "../lib/physics.js";

// dark text on pale keys, white text on dark ones
const isLight = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) > 150;
};

const items = heroKeys;
const MID = (items.length - 1) / 2;
const FLARE = (62 * Math.PI) / 180;    // how far the outermost keys lean out
const HOOK_ARC = (36 * Math.PI) / 180; // the holes are all hooked into this small patch at the bottom of the ring

const openKey = (k) => {
    if (k.href.startsWith('#')) {
        document.querySelector(k.href)?.scrollIntoView({ behavior: 'smooth' });
    } else if (k.download) {
        const a = document.createElement('a');
        a.href = k.href;
        a.download = k.download;
        a.click();
    } else {
        window.open(k.href, '_blank', 'noopener');
    }
};

// The key ring that hangs from the top of the hero: a small ring with every key hooked onto the same patch
// of it, so the hooks overlap and the keys splay outward as they hang, like a skirt. Each key is a fact about
// you or a link. They sway on their hooks; drag one and let go and it swings back. Hover to slide one out.
const HeroKeys = () => {
    const stageRef = useRef(null);

    useSim(stageRef, (stage, { run }) => {
        const W = stage.clientWidth;
        const n = items.length;
        const s = clamp(W / 470, 0.6, 1.2);
        stage.style.setProperty('--s', s);

        const fh = 196 * s;
        const hole = 20 * s;
        const stick = fh - hole * 1.5;

        const R = 54 * s;
        const cx = W / 2;
        const plateY = 24;                      // the round plate screwed into the wall
        const bowlY = plateY + 40;              // the bottom of the hook's bowl: the ring's top rests on it
        const cy = bowlY + R - 7;

        stage.style.height = `${cy + R + fh + 44}px`;
        const H = stage.clientHeight;

        // the wall hook: a plate with a screw, and a J-hook whose bowl holds the ring
        stage.querySelector('.hook-plate').setAttribute('cx', cx);
        stage.querySelector('.hook-plate').setAttribute('cy', plateY);
        stage.querySelector('.hook-screw').setAttribute('d', `M${cx - 5} ${plateY + 3} L${cx + 5} ${plateY - 3}`);
        stage.querySelector('.hook-body').setAttribute('d',
            `M${cx - 12} ${plateY} L${cx - 12} ${bowlY - 12} A12 12 0 0 0 ${cx + 12} ${bowlY - 12} L${cx + 12} ${bowlY - 26}`);

        // the ring: a plain circle resting in the hook
        const C = 2 * Math.PI * R;
        const ring = stage.querySelector('.ring-main');
        const hi = stage.querySelector('.ring-hi');
        for (const el of [ring, hi]) { el.setAttribute('cx', cx); el.setAttribute('cy', cy); }
        ring.setAttribute('r', R);
        hi.setAttribute('r', R - 2.5);
        hi.style.strokeDasharray = `${C * 0.2} ${C}`;
        hi.setAttribute('transform', `rotate(-125 ${cx} ${cy})`);

        const world = new Verlet({ gravity: 0.5, damping: 0.975, iterations: 6 });

        const fobs = items.map((item, i) => {
            const u = (i - MID) / MID;                         // -1 (far left) .. 1 (far right)
            const th = u * HOOK_ARC;
            const hook = world.point(cx + Math.sin(th) * R, cy + Math.cos(th) * R, true);
            const tip = world.point(hook.x, hook.y + stick);   // start hanging straight down: the skirt opens when seen
            world.link(hook, tip, stick);
            return { item, hook, tip, phi: u * FLARE };
        });

        let grab = null;
        world.forces.push(() => {
            for (let i = 0; i < n; i++) {
                const f = fobs[i];
                if (grab && grab.i === i) {
                    if (grab.target) {
                        f.tip.x += (grab.target.x + grab.off.x - f.tip.x) * 0.35;
                        f.tip.y += (grab.target.y + grab.off.y - f.tip.y) * 0.35;
                    }
                    continue;
                }
                // a gentle spring leans each key toward its place in the skirt, so it sways but keeps the shape
                f.tip.x += (f.hook.x + Math.sin(f.phi) * stick - f.tip.x) * 0.06;
                f.tip.y += (f.hook.y + Math.cos(f.phi) * stick - f.tip.y) * 0.06;
            }
            for (const f of fobs) {
                f.tip.x = clamp(f.tip.x, 10, W - 10);
                f.tip.y = clamp(f.tip.y, 0, H - 6);
            }
        });

        const nodes = [...stage.querySelectorAll('.fob')];

        const cleanups = nodes.map((node, i) => {
            const down = (e) => {
                const pt = localPoint(e, stage);
                const f = fobs[i];
                grab = {
                    i,
                    target: pt,
                    off: { x: f.tip.x - pt.x, y: f.tip.y - pt.y },
                    sx: e.clientX, sy: e.clientY, t: performance.now(), moved: 0,
                };
                node.setPointerCapture(e.pointerId);
                node.classList.add('held');
                run(6000);
            };
            const move = (e) => {
                if (!grab || grab.i !== i) return;
                grab.target = localPoint(e, stage);
                grab.moved = Math.max(grab.moved, Math.hypot(e.clientX - grab.sx, e.clientY - grab.sy));
            };
            const up = () => {
                if (!grab || grab.i !== i) return;
                if (grab.moved < 6 && performance.now() - grab.t < 450) openKey(fobs[i].item);
                grab = null;
                node.classList.remove('held');
                run(4000);
            };
            const enter = () => { if (!grab) node.classList.add('lift'); };
            const leave = () => node.classList.remove('lift');
            node.addEventListener('pointerdown', down);
            node.addEventListener('pointermove', move);
            node.addEventListener('pointerup', up);
            node.addEventListener('pointercancel', up);
            node.addEventListener('pointerenter', enter);
            node.addEventListener('pointerleave', leave);
            node.addEventListener('focus', enter);
            node.addEventListener('blur', leave);
            return () => {
                node.removeEventListener('pointerdown', down);
                node.removeEventListener('pointermove', move);
                node.removeEventListener('pointerup', up);
                node.removeEventListener('pointercancel', up);
                node.removeEventListener('pointerenter', enter);
                node.removeEventListener('pointerleave', leave);
                node.removeEventListener('focus', enter);
                node.removeEventListener('blur', leave);
            };
        });

        return {
            step: () => world.step(),
            render: () => {
                fobs.forEach((f, i) => {
                    const angle = Math.atan2(f.tip.x - f.hook.x, f.tip.y - f.hook.y);
                    nodes[i].style.transform = `translate3d(${f.hook.x.toFixed(2)}px, ${f.hook.y.toFixed(2)}px, 0) rotate(${(-angle).toFixed(4)}rad)`;
                });
            },
            cleanup: () => cleanups.forEach((fn) => fn()),
        };
    });

    return (
        <div className="stage keyring" ref={stageRef}>
            <svg className="rings" aria-hidden="true">
                <circle className="hook-plate" r="11" />
                <path className="hook-screw" d="" />
                <path className="hook-body" d="" />
                <circle className="ring-main" />
                <circle className="ring-hi" />
            </svg>

            {items.map((k, i) => (
                <div key={k.id}
                     className={`fob${i > MID ? ' right' : ''}`}
                     data-i={i}
                     style={{ '--c': k.color, color: isLight(k.color) ? '#18181b' : '#fff', zIndex: 20 - Math.round(Math.abs(i - MID) * 2) }}
                     role="link" tabIndex={0}
                     aria-label={`${k.title}. ${k.note}.`}
                     onKeyDown={(e) => e.key === 'Enter' && openKey(k)}>
                    <div className="fob-body">
                        <div className="fob-face">
                            <span className="fob-tag">{k.tag}</span>
                            <span>
                                <b className="fob-title">{k.title}</b>
                                <small className="fob-note">{k.note}</small>
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}
export default HeroKeys
