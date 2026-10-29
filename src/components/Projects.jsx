import {useRef, useState} from "react";
import {useGSAP} from "@gsap/react";
import gsap from "gsap";
import {ScrollTrigger} from "gsap/all";
import {projects} from "../constants";
import SectionTitle from "./SectionTitle.jsx";

const STACK_COUNT = 5;
const stacked = projects.slice(0, STACK_COUNT);
const more = projects.slice(STACK_COUNT);

const flagClass = (status) => (status === 'In progress' ? 'wip' : status === 'Live' ? '' : 'src');

const Projects = () => {
    const sectionRef = useRef(null);
    const cursorRef = useRef(null);
    const [showMore, setShowMore] = useState(false);

    // opening or closing the panel changes the page height, so the scroll animations below it re-measure
    const toggleMore = (next) => {
        setShowMore(next);
        setTimeout(() => ScrollTrigger.refresh(), 700);
    };

    useGSAP(() => {
        const mm = gsap.matchMedia();

        // Stacked cards: as the next card slides over, the one beneath scales back, blurs and dims
        // (Stanley's depth + David's blur). Desktop only; on phones the cards simply stack down the page.
        // Only scale is tweened; the dimming and blur are driven by the --cp CSS variable (0 to 1),
        // which is gentler and can't blacken the card the way a tweened `filter` string can.
        mm.add('(min-width: 768px)', () => {
            const cards = gsap.utils.toArray('#projects .case');
            cards.slice(0, -1).forEach((card, i) => {
                const inner = card.querySelector('.case-inner');
                gsap.to(card, {
                    scale: 0.94,
                    transformOrigin: '50% 0%',
                    ease: 'none',
                    scrollTrigger: {
                        trigger: cards[i + 1],
                        start: () => `top ${72 + card.offsetHeight}px`,
                        end: () => 'top 72px',
                        scrub: true,
                        invalidateOnRefresh: true,
                        onUpdate: (self) => inner.style.setProperty('--cp', self.progress.toFixed(3)),
                        onLeaveBack: () => inner.style.setProperty('--cp', '0'),
                    },
                });
            });
        });

        // Each card: the screenshot panel wipes open left to right, then the text rises in line by line.
        gsap.utils.toArray('#projects .case').forEach((card) => {
            const trigger = { trigger: card, start: 'top 92%', once: true };
            gsap.fromTo(card.querySelector('.visual'),
                { clipPath: 'inset(0% 100% 0% 0% round 14px)' },
                { clipPath: 'inset(0% 0% 0% 0% round 14px)', duration: 1.1, ease: 'power4.out', immediateRender: false, scrollTrigger: trigger });
            gsap.from(card.querySelectorAll('.info > *'),
                { y: 24, opacity: 0, duration: 0.8, stagger: 0.08, delay: 0.15, ease: 'power3.out', immediateRender: false, scrollTrigger: trigger });
        });

        // Round "View" bubble that follows the cursor over a card (mouse devices only).
        const cursor = cursorRef.current;
        if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return () => mm.revert();

        const moveX = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3.out' });
        const moveY = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3.out' });

        const cards = gsap.utils.toArray('#projects .case-inner');
        const cleanups = cards.map((card) => {
            const onMove = (e) => {
                const overCode = e.target.closest('.code');
                gsap.to(cursor, { opacity: overCode ? 0 : 1, scale: overCode ? 0.6 : 1, duration: 0.25, overwrite: 'auto' });
                moveX(e.clientX - cursor.offsetWidth / 2);
                moveY(e.clientY - cursor.offsetHeight / 2);
            };
            const onLeave = () => gsap.to(cursor, { opacity: 0, scale: 0.6, duration: 0.25, overwrite: 'auto' });
            card.addEventListener('mousemove', onMove);
            card.addEventListener('mouseleave', onLeave);
            return () => {
                card.removeEventListener('mousemove', onMove);
                card.removeEventListener('mouseleave', onLeave);
            };
        });

        return () => {
            mm.revert();
            cleanups.forEach((fn) => fn());
        };
    }, { scope: sectionRef });

    return (
        <section id="projects" ref={sectionRef}>
            <div className="head">
                <SectionTitle lines={['Selected', 'work']} count={stacked.length} />

                <div className="side" data-reveal style={{ '--i': 2 }}>
                    <p>Full-stack apps, mobile and animated sites, picked from {projects.length} projects.</p>
                    <a
                        href="#more-projects"
                        onClick={(e) => {
                            e.preventDefault();
                            toggleMore(true);
                            setTimeout(() => document.querySelector('#more-projects')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
                        }}
                    >
                        All projects <span aria-hidden="true">↗</span>
                    </a>
                </div>
            </div>

            <div className="stack">
                {stacked.map(({ id, title, headline, kind, status, description, image, color, tags, link, github }) => (
                    <article key={id} className="case">
                        <div className="case-inner">
                            <div className="visual" style={{ '--base': color }}>
                                <img src={image} alt={`${title} screenshot`} loading="lazy" />
                            </div>

                            <div className="info">
                                <div className="org">
                                    <span className="logo">{title.charAt(0).toUpperCase()}</span>
                                    <div>
                                        <b>{title}</b>
                                        <small>{kind}</small>
                                    </div>
                                </div>

                                <p className={`flag ${flagClass(status)}`}>{status}</p>
                                <h3 className="headline">{headline}</h3>
                                <p className="desc">{description}</p>

                                <div className="foot">
                                    <div>
                                        <ul className="tags">
                                            {tags.slice(0, 3).map((tag) => <li key={tag}>{tag}</li>)}
                                        </ul>
                                        {link !== github && (
                                            <a className="code mt-4 inline-block" href={github} target="_blank" rel="noreferrer">
                                                View code ↗
                                            </a>
                                        )}
                                    </div>
                                    <span className="go" aria-hidden="true">→</span>
                                </div>
                            </div>

                            <a className="hit" href={link} target="_blank" rel="noreferrer" aria-label={`Open ${title}`} />
                        </div>
                    </article>
                ))}
            </div>

            <div className={`more${showMore ? ' open' : ''}`} id="more-projects">
                <button
                    type="button"
                    className="more-toggle"
                    aria-expanded={showMore}
                    aria-controls="more-list"
                    onClick={() => toggleMore(!showMore)}
                >
                    <span>{showMore ? 'Hide' : 'Show'} {more.length} more projects</span>
                    <i aria-hidden="true" />
                </button>

                <div className="more-body" id="more-list" inert={!showMore}>
                    <div className="more-inner">
                        {more.map(({ id, title, description, image, tags, link, github }, i) => (
                            <div key={id} className="more-row" data-reveal style={{ '--i': i }}>
                                <img src={image} alt={`${title} screenshot`} loading="lazy" />
                                <div>
                                    <h4>{title}</h4>
                                    <p>{description}</p>
                                    <p className="mt-2 font-mono text-xs uppercase tracking-widest text-accent">{tags.join(' · ')}</p>
                                </div>
                                <div className="links">
                                    {link !== github && <a href={link} target="_blank" rel="noreferrer">Live ↗</a>}
                                    <a href={github} target="_blank" rel="noreferrer">Code ↗</a>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div ref={cursorRef} className="cursor" aria-hidden="true">
                <span>View</span>
                <span>↗</span>
            </div>
        </section>
    )
}
export default Projects
