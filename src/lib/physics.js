import {useEffect} from "react";

// A tiny Verlet physics engine: points that remember where they were, and links that keep
// two points a fixed distance apart. Ropes, chains and swinging objects are all built from that.
export class Verlet {
    constructor({ gravity = 0.45, damping = 0.995, iterations = 8 } = {}) {
        this.gravity = gravity;
        this.damping = damping;
        this.iterations = iterations;
        this.points = [];
        this.links = [];
        this.forces = [];       // fn(world), runs after integration, before constraints
        this.constraints = [];  // fn(world), runs every solver iteration (collisions, bounds...)
    }

    point(x, y, pinned = false) {
        const p = { x, y, px: x, py: y, pinned };
        this.points.push(p);
        return p;
    }

    link(a, b, length = Math.hypot(b.x - a.x, b.y - a.y), stiffness = 1, slack = false) {
        const l = { a, b, length, stiffness, slack };
        this.links.push(l);
        return l;
    }

    // teleport a point (used for pinned points that follow something else)
    place(p, x, y) {
        p.x = x; p.y = y; p.px = x; p.py = y;
    }

    // give a point a push (impulse) by rewriting its remembered position
    nudge(p, dx, dy) {
        p.px -= dx; p.py -= dy;
    }

    step() {
        for (const p of this.points) {
            if (p.pinned) continue;
            const vx = (p.x - p.px) * this.damping;
            const vy = (p.y - p.py) * this.damping;
            p.px = p.x; p.py = p.y;
            p.x += vx;
            p.y += vy + this.gravity;
        }
        for (const f of this.forces) f(this);
        for (let i = 0; i < this.iterations; i++) {
            for (const { a, b, length, stiffness, slack } of this.links) {
                const dx = b.x - a.x, dy = b.y - a.y;
                const d = Math.hypot(dx, dy) || 0.0001;
                if (slack && d < length) continue;
                const wa = a.pinned ? 0 : 1, wb = b.pinned ? 0 : 1;
                const w = wa + wb;
                if (!w) continue;
                const diff = ((d - length) / d) * stiffness;
                a.x += dx * diff * (wa / w); a.y += dy * diff * (wa / w);
                b.x -= dx * diff * (wb / w); b.y -= dy * diff * (wb / w);
            }
            for (const c of this.constraints) c(this);
        }
    }
}

export const localPoint = (e, el) => {
    const r = el.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
};

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// Runs a simulation only while its container is on screen (fixed 60Hz steps, any display rate).
// `setup(el, { run })` builds the world and returns { step, render, cleanup? }.
// With reduced-motion the world is settled once and only animates briefly after the visitor interacts (via run(ms)).
// It is rebuilt if the container's width changes (rotating a phone, resizing the window).
export function useSim(ref, setup) {
    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const STEP = 1000 / 60;
        let sim = null;
        let raf = 0;
        let last = 0;
        let acc = 0;
        let visible = false;
        let forceUntil = 0;
        let width = el.clientWidth;

        const frame = (t) => {
            raf = requestAnimationFrame(frame);
            acc += Math.min(t - last, 50);
            last = t;
            let n = 0;
            while (acc >= STEP && n < 3) { sim.step(); acc -= STEP; n++; }
            sim.render();
            if (reduced && t > forceUntil) stop();
        };
        const start = () => {
            if (raf) return;
            last = performance.now();
            raf = requestAnimationFrame(frame);
        };
        const stop = () => {
            cancelAnimationFrame(raf);
            raf = 0;
        };
        const run = (ms = 3000) => {
            forceUntil = performance.now() + ms;
            start();
        };

        const build = () => {
            sim?.cleanup?.();
            sim = setup(el, { run });
            if (reduced) {
                for (let i = 0; i < 300; i++) sim.step();
                sim.render();
            }
        };
        build();

        const io = new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
            if (visible && !reduced) start();
            else if (!visible) stop();
        }, { rootMargin: '120px' });
        io.observe(el);

        let resizeTimer = 0;
        const ro = new ResizeObserver(() => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                if (Math.abs(el.clientWidth - width) < 40) return;
                width = el.clientWidth;
                build();
            }, 200);
        });
        ro.observe(el);

        return () => {
            io.disconnect();
            ro.disconnect();
            clearTimeout(resizeTimer);
            stop();
            sim?.cleanup?.();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
}
