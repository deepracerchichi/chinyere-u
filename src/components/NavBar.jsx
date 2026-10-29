import {useEffect, useState} from "react";
import {navLinks, profile} from "../constants";

// Floating glass pill (David) that slides in after the intro (Stanley), with a full-screen menu on phones.
const NavBar = ({ ready }) => {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const onKey = (e) => e.key === 'Escape' && setOpen(false);
        document.addEventListener('keydown', onKey);
        document.documentElement.classList.toggle('mm-lock', open);
        return () => document.removeEventListener('keydown', onKey);
    }, [open]);

    return (
        <>
            <header className="capsule-wrap">
                <nav className={`capsule${ready ? ' in' : ''}`} aria-label="Primary">
                    <a href="#hero" className="mark" aria-label={`${profile.name}, home`}>
                        <img src="/monogram.svg" alt="" />
                    </a>

                    <ul>
                        {navLinks.map(({ label, href }) => (
                            <li key={label}><a href={href}>{label}</a></li>
                        ))}
                    </ul>

                    <a href="#contact" className="cta">Let's talk</a>

                    <button
                        type="button"
                        className="menu-btn"
                        aria-expanded={open}
                        aria-controls="mm"
                        onClick={() => setOpen((o) => !o)}
                    >
                        {open ? 'Close' : 'Menu'}
                    </button>
                </nav>
            </header>

            <div id="mm" className={`mm${open ? ' open' : ''}`} role="dialog" aria-modal="true" aria-label="Menu">
                <ul>
                    {[...navLinks, { label: "Contact", href: "#contact" }].map(({ label, href }, i) => (
                        <li key={label}>
                            <a href={href} onClick={() => setOpen(false)}>
                                {label}<span>{String(i + 1).padStart(2, '0')}</span>
                            </a>
                        </li>
                    ))}
                </ul>
                <a href={`mailto:${profile.email}`} className="mm-mail">{profile.email}</a>
            </div>
        </>
    )
}
export default NavBar
