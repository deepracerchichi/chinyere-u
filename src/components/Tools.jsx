import {useGSAP} from "@gsap/react";
import gsap from "gsap";
import {toolGroups} from "../constants";
import SectionTitle from "./SectionTitle.jsx";

const Tools = () => {
    useGSAP(() => {
        // transform-only entrance (never touches opacity, so chips can't end up hidden)
        gsap.from('#tools .tool', {
            scale: 0.6,
            y: 18,
            duration: 0.7,
            stagger: 0.03,
            ease: 'back.out(1.7)',
            scrollTrigger: { trigger: '#tools .tool-groups', start: 'top 88%', once: true },
        });

        // magnetic hover: chips lean toward the cursor, then spring back
        if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
        const cleanups = gsap.utils.toArray('#tools .tool').map((chip) => {
            const move = (e) => {
                const r = chip.getBoundingClientRect();
                gsap.to(chip, { x: (e.clientX - r.left - r.width / 2) * 0.35, y: (e.clientY - r.top - r.height / 2) * 0.35, duration: 0.3, ease: 'power3.out' });
            };
            const leave = () => gsap.to(chip, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' });
            chip.addEventListener('mousemove', move);
            chip.addEventListener('mouseleave', leave);
            return () => {
                chip.removeEventListener('mousemove', move);
                chip.removeEventListener('mouseleave', leave);
            };
        });
        return () => cleanups.forEach((fn) => fn());
    });

    return (
    <section id="tools">
        <SectionTitle lines={['Tools', 'I reach for']} />

        <div className="tool-groups">
            {toolGroups.map(({ title, tools }, g) => (
                <div key={title} data-reveal style={{ '--i': g }}>
                    <h3>{title}</h3>
                    <ul className="tool-list">
                        {tools.map((tool) => (
                            <li key={tool} className="tool">{tool}</li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    </section>
    )
}
export default Tools
