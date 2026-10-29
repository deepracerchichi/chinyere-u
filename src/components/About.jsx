import {useRef} from "react";
import {useGSAP} from "@gsap/react";
import gsap from "gsap";
import {articles, experience, profile, projects, statement} from "../constants";

const stats = [
    { to: profile.year - 2021, label: "Years in software, since 2021" },
    { to: projects.length, label: "Projects in my portfolio" },
    { to: experience.filter((e) => !e.education).length, label: "Teams worked with" },
    { to: articles.length, label: "Articles written" },
];

// Stanley's About: the section pins, the statement's words go from pale to ink as you scroll,
// the sign-off appears, then the numbers count up.
const About = () => {
    const sectionRef = useRef(null);

    useGSAP(() => {
        const words = gsap.utils.toArray('#about .stmt .w');
        const nums = gsap.utils.toArray('#about .num');
        let counted = false;

        const count = () => {
            if (counted) return;
            counted = true;
            nums.forEach((el) => {
                const o = { v: 0 };
                gsap.to(o, {
                    v: +el.dataset.to,
                    duration: 1.1,
                    ease: 'power3.out',
                    onUpdate: () => { el.textContent = Math.round(o.v); },
                });
            });
        };

        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: '#about',
                start: 'top top',
                end: () => `+=${Math.round(window.innerHeight * 1.6)}`,
                scrub: 0.6,
                pin: true,
                anticipatePin: 1,
                invalidateOnRefresh: true,
            },
        });

        tl.fromTo(words, { opacity: 0.14 }, { opacity: 1, ease: 'none', stagger: 0.1, duration: 0.1 })
            .fromTo('#about .sign', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.6 })
            .fromTo('#about .stat', { opacity: 0, y: 24 }, { opacity: 1, y: 0, stagger: 0.15, duration: 0.5 }, '>-0.1')
            .call(count);
    }, { scope: sectionRef });

    return (
        <section id="about" ref={sectionRef}>
            <div className="about-inner">
                <p className="eyebrow">About</p>

                <p className="stmt">
                    {statement.split(' ').map((word, i) => <span key={i} className="w">{word}</span>)}
                </p>

                <p className="sign">{profile.name}, {profile.role}</p>

                <ul className="stats">
                    {stats.map(({ to, label }) => (
                        <li key={label} className="stat">
                            <strong className="num" data-to={to}>0</strong>
                            <span>{label}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    )
}
export default About
