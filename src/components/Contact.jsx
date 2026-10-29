import {useRef} from "react";
import gsap from "gsap";
import {profile} from "../constants";
import useSendMessage from "../hooks/useSendMessage.js";
import SectionTitle from "./SectionTitle.jsx";
import {Verlet, localPoint, useSim} from "../lib/physics.js";

const CORD_SEGMENTS = 6;
const SEG_LEN = 24;
const HANG = 220;     // length of the lamp's hanging wire

// Contact, as a dark room. A lamp swings from the top of the room; pull its cord (drag the bead down and let go,
// or just click it) and the lights come on. The form is usable in the dark too, and focusing a field turns the light on.
const Contact = () => {
    const roomRef = useRef(null);
    const stageRef = useRef(null);
    const lightRef = useRef(null);
    const { status, send } = useSendMessage();

    useSim(stageRef, (stage, { run }) => {
        const room = roomRef.current;
        const W = stage.clientWidth;

        // On desktop the lamp hangs straight above the form (so its light falls on it); on phones it's centred.
        let cx = W / 2;
        let spread = 300;
        const form = room.querySelector('form');
        if (form && window.matchMedia('(min-width: 900px)').matches) {
            const fr = form.getBoundingClientRect();
            const sr = stage.getBoundingClientRect();
            cx = fr.left - sr.left + fr.width / 2;
            spread = fr.width / 2 + 40;
        }
        stage.style.setProperty('--lamp-x', `${cx}px`);
        stage.querySelector('.beam').setAttribute('points', `-44,60 44,60 ${spread},640 ${-spread},640`);

        const world = new Verlet({ gravity: 0.5, damping: 0.992, iterations: 8 });
        const anchor = world.point(cx, 0, true);
        const lamp = world.point(cx + 30, HANG * 0.95);
        world.link(anchor, lamp, HANG);

        // pull cord: starts at the shade's right edge, ends in a bead on a slightly stretchy last link
        const start = world.point(cx + 44, HANG + 56, true);
        const cord = [start];
        for (let k = 1; k <= CORD_SEGMENTS; k++) cord.push(world.point(cx + 44, HANG + 56 + k * SEG_LEN));
        for (let k = 0; k < CORD_SEGMENTS - 1; k++) world.link(cord[k], cord[k + 1], SEG_LEN);
        world.link(cord[CORD_SEGMENTS - 1], cord[CORD_SEGMENTS], SEG_LEN, 0.12);
        const bead = cord[CORD_SEGMENTS];

        let on = room.classList.contains('on');
        let grab = null;
        const nodes = {
            shade: stage.querySelector('.lamp-rot'),
            hang: stage.querySelector('.hang'),
            cord: stage.querySelector('.cord'),
            bead: stage.querySelector('.pull'),
            beam: stage.querySelector('.beam'),
            glow: stage.querySelector('.bulb-glow'),
        };

        const lampAngle = () => Math.atan2(lamp.x - anchor.x, lamp.y - anchor.y);

        // the cord rides on the shade, and tugging it tips the lamp
        world.forces.push(() => {
            const a = lampAngle();
            const ox = 44, oy = 56;
            const rx = Math.cos(-a) * ox - Math.sin(-a) * oy;
            const ry = Math.sin(-a) * ox + Math.cos(-a) * oy;
            world.place(start, lamp.x + rx, lamp.y + ry);
            const tug = Math.hypot(bead.x - cord[CORD_SEGMENTS - 1].x, bead.y - cord[CORD_SEGMENTS - 1].y) - SEG_LEN;
            if (tug > 0) world.nudge(lamp, (bead.x - lamp.x) * 0.0009 * tug * 0.1, 0);
            if (grab && grab.target) {
                bead.x += (grab.target.x - bead.x) * 0.4;
                bead.y += (grab.target.y - bead.y) * 0.4;
            }
        });

        const setLight = (value) => {
            if (value === on) return;
            on = value;
            room.classList.toggle('on', on);
            nodes.bead.setAttribute('aria-pressed', String(on));
            gsap.killTweensOf([nodes.beam, nodes.glow]);
            const flicker = on ? [0, 0.9, 0.15, 1, 0.45, 1] : [1, 0.35, 0.8, 0];
            const tl = gsap.timeline();
            flicker.forEach((o) => tl.to([nodes.beam, nodes.glow], { opacity: o, duration: 0.07 }));
            world.nudge(lamp, on ? 3 : -3, 0);
            run(3000);
        };
        lightRef.current = setLight;
        gsap.set([nodes.beam, nodes.glow], { opacity: on ? 1 : 0 });
        nodes.bead.setAttribute('aria-pressed', String(on));

        const down = (e) => {
            grab = { target: localPoint(e, stage), sx: e.clientX, sy: e.clientY, t: performance.now(), moved: 0 };
            nodes.bead.setPointerCapture(e.pointerId);
            nodes.bead.classList.add('held');
            run(6000);
        };
        const move = (e) => {
            if (!grab) return;
            grab.target = localPoint(e, stage);
            grab.moved = Math.max(grab.moved, Math.hypot(e.clientX - grab.sx, e.clientY - grab.sy));
        };
        const up = () => {
            if (!grab) return;
            const stretched = Math.hypot(bead.x - cord[CORD_SEGMENTS - 1].x, bead.y - cord[CORD_SEGMENTS - 1].y) > SEG_LEN + 26;
            const click = grab.moved < 6 && performance.now() - grab.t < 450;
            grab = null;
            nodes.bead.classList.remove('held');
            if (stretched || click) setLight(!on);
            run(4000);
        };
        const key = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setLight(!on); } };
        nodes.bead.addEventListener('pointerdown', down);
        nodes.bead.addEventListener('pointermove', move);
        nodes.bead.addEventListener('pointerup', up);
        nodes.bead.addEventListener('pointercancel', up);
        nodes.bead.addEventListener('keydown', key);
        // screen readers and switch devices activate buttons with a plain click (no pointer events)
        const plainClick = (e) => { if (e.detail === 0) setLight(!on); };
        nodes.bead.addEventListener('click', plainClick);

        // while it's dark, give the cord a little tug now and then so people notice it
        const hint = setInterval(() => {
            if (!on && !grab && !document.hidden) { world.nudge(bead, 0, 5); run(2500); }
        }, 5000);
        world.nudge(lamp, 4, 0);

        return {
            step: () => world.step(),
            render: () => {
                const deg = (-lampAngle() * 180) / Math.PI;
                nodes.hang.setAttribute('x1', anchor.x.toFixed(1));
                nodes.hang.setAttribute('y1', anchor.y.toFixed(1));
                nodes.hang.setAttribute('x2', lamp.x.toFixed(1));
                nodes.hang.setAttribute('y2', lamp.y.toFixed(1));
                nodes.shade.setAttribute('transform', `translate(${lamp.x.toFixed(1)} ${lamp.y.toFixed(1)}) rotate(${deg.toFixed(2)})`);
                nodes.cord.setAttribute('d', 'M' + cord.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L'));
                nodes.bead.style.transform = `translate3d(${bead.x.toFixed(1)}px, ${bead.y.toFixed(1)}px, 0)`;
            },
            cleanup: () => {
                clearInterval(hint);
                lightRef.current = null;
                nodes.bead.removeEventListener('pointerdown', down);
                nodes.bead.removeEventListener('pointermove', move);
                nodes.bead.removeEventListener('pointerup', up);
                nodes.bead.removeEventListener('pointercancel', up);
                nodes.bead.removeEventListener('keydown', key);
                nodes.bead.removeEventListener('click', plainClick);
            },
        };
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const data = Object.fromEntries(new FormData(form));

        // Honeypot: real visitors never fill this in.
        if (data.company) return;

        const result = await send(data);
        if (result === 'sent') form.reset();
    };

    return (
        <section id="contact" className="room" ref={roomRef}>
            <div className="room-inner">
                <div className="stage lamp-stage" ref={stageRef}>
                    <svg className="rings" aria-hidden="true">
                        <line className="hang" x1="0" y1="0" x2="0" y2="0" />
                        <g className="lamp-rot">
                            <polygon className="beam" points="-44,60 44,60 360,520 -360,520" />
                            <path className="shade" d="M -14 0 L 14 0 L 56 60 L -56 60 Z" />
                            <circle className="bulb-glow" cx="0" cy="62" r="40" />
                            <circle className="bulb" cx="0" cy="64" r="13" />
                        </g>
                        <path className="cord" d="" />
                    </svg>
                    <button type="button" className="pull" aria-label="Pull the cord to switch the light on or off" aria-pressed="false">
                        <span />
                    </button>
                    <p className="cord-hint" aria-hidden="true">Pull me</p>
                    <p className="neon" aria-hidden="true">say hello</p>
                </div>

                <div className="contact-grid" onFocusCapture={() => lightRef.current?.(true)}>
                    <div className="intro" data-reveal>
                        <SectionTitle lines={["Let's work", 'together']} />
                        <p>
                            Need a website, dashboard, or custom web application? Send a message and I'll get back to you, or email me at{" "}
                            <a href={`mailto:${profile.email}`}>{profile.email}</a>.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} data-reveal style={{ '--i': 2 }}>
                        <label>
                            Name
                            <input name="name" type="text" required autoComplete="name" />
                        </label>
                        <label>
                            Email
                            <input name="email" type="email" required autoComplete="email" />
                        </label>
                        <label>
                            Message
                            <textarea name="message" rows={5} required />
                        </label>

                        {/* honeypot */}
                        <input name="company" type="text" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

                        <button type="submit" className="btn self-start" disabled={status === 'sending'}>
                            {status === 'sending' ? 'Sending...' : 'Send message'}
                        </button>

                        <p className="status-msg" role="status">
                            {status === 'sent' && 'Your message has been sent successfully! I will get back to you soon.'}
                            {status === 'error' && 'Failed to send message. Please try again or email me directly.'}
                        </p>
                    </form>
                </div>
            </div>
        </section>
    )
}
export default Contact
