import {profile} from "../constants";
import HeroKeys from "./HeroKeys.jsx";

const letters = (text, offset, dim = false) =>
    [...text].map((ch, i) => <span key={i} className={dim ? 'l dim' : 'l'} style={{ '--i': offset + i }}>{ch}</span>);

// Top of the page: what you do (the pitch), the keys hanging from the top edge, and your name as a wordmark.
// The keys only mount once the intro has lifted, so they swing open where people can see it.
const Hero = ({ ready }) => {
    const [first, last] = profile.name.split(' ');

    return (
        <section id="hero" className={ready ? 'go' : ''}>
            {ready && <div className="hero-keys"><HeroKeys /></div>}

            <p className="status hero-line" style={{ '--d': 0 }}><i /> {profile.availability}</p>

            <h1 className="pitch hero-line" style={{ '--d': 1 }}>
                <span className="sr-only">{profile.name}. </span>
                {profile.pitch[0]} <span>{profile.pitch[1]}</span>
            </h1>

            <p className="lead hero-line" style={{ '--d': 2 }}>{profile.tagline}</p>

            <div className="actions hero-line" style={{ '--d': 3 }}>
                <a className="btn" href="#projects">See my work</a>
                <a className="btn-ghost" href="/ChinyereUkpong-CV.pdf" download="ChinyereUkpong-CV.pdf">Download CV</a>
            </div>

            <p className="wm" aria-hidden="true">
                <span className="ln">
                    {letters(first, 0)}
                    <span className="sp" />
                    {letters(last, first.length, true)}
                </span>
            </p>
        </section>
    )
}
export default Hero
