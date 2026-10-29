import {useCallback, useEffect, useState} from "react";
import {useGSAP} from "@gsap/react";
import gsap from 'gsap';
import { ScrollTrigger } from "gsap/all";
import {profile} from "./constants";
import Boot from "./components/Boot.jsx";
import NavBar from "./components/NavBar.jsx";
import Hero from "./components/Hero.jsx";
import Projects from "./components/Projects.jsx";
import About from "./components/About.jsx";
import Experience from "./components/Experience.jsx";
import Tools from "./components/Tools.jsx";
import Services from "./components/Services.jsx";
import Articles from "./components/Articles.jsx";
import Contact from "./components/Contact.jsx";
import Footer from "./components/Footer.jsx";

gsap.registerPlugin(ScrollTrigger)

const App = () => {
    const [ready, setReady] = useState(false);
    const onBootDone = useCallback(() => setReady(true), []);

    // Fade-up reveal for anything marked [data-reveal] (David's pattern). It watches real
    // visibility, so content can never get stuck hidden if the layout shifts after load.
    useEffect(() => {
        document.documentElement.classList.add('reveal-ready');

        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                // also reveal things the visitor has already scrolled past (anchor jumps)
                if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
                    entry.target.setAttribute('data-revealed', '');
                    io.unobserve(entry.target);
                }
            });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });

        document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));
        return () => io.disconnect();
    }, []);

    // Fonts and lazy images change heights after first paint; re-measure the scroll animations.
    useEffect(() => {
        const refresh = () => ScrollTrigger.refresh();
        document.fonts?.ready.then(refresh);
        window.addEventListener('load', refresh);
        return () => window.removeEventListener('load', refresh);
    }, []);

    // Page-wide scroll motion
    useGSAP(() => {
        // thin progress bar along the top
        gsap.to('.progress', {
            scaleX: 1,
            ease: 'none',
            scrollTrigger: { start: 0, end: 'max', scrub: 0.2 },
        });

        // big headings drift slightly slower than the page
        gsap.utils.toArray('.title').forEach((title) => {
            gsap.fromTo(title, { y: 36 }, {
                y: -36,
                ease: 'none',
                scrollTrigger: { trigger: title, start: 'top bottom', end: 'bottom top', scrub: true },
            });
        });

        // an ink line draws itself across each row's hairline as it arrives
        gsap.utils.toArray('[data-rule]').forEach((row) => {
            gsap.fromTo(row, { '--rule': 0 }, {
                '--rule': 1,
                duration: 1.3,
                ease: 'power3.out',
                immediateRender: false,
                scrollTrigger: { trigger: row, start: 'top 92%', once: true },
            });
        });
    }, []);

    return (
<main>
            <div className="progress" aria-hidden="true" />
            <Boot name={profile.name} role={profile.role} onDone={onBootDone} />
            <NavBar ready={ready} />
            <Hero ready={ready} />
            <Projects />
            <About />
            <Experience />
            <Tools />
            <Services />
            <Articles />
            <Contact />
            <Footer />
        </main>
    )
}

export default App
