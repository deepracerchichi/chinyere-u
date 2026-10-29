import {useState} from "react";
import {experience, footerLinks, profile} from "../constants/index.js";

const Footer = () => {
    const [copied, setCopied] = useState(false);
    const current = experience[0];

    const copyEmail = async () => {
        try {
            await navigator.clipboard.writeText(profile.email);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        } catch {
            window.location.href = `mailto:${profile.email}`;
        }
    };

    return (
        <footer>
            <div className="foot-top" data-reveal>
                <p className="now"><i /> Now: {current.role} at {current.company}</p>
                <button type="button" className="foot-copy" onClick={copyEmail}>
                    {copied ? 'Copied ✓' : profile.email}
                </button>
            </div>

            <hr />

            <div className="links">
                <p>Copyright © {profile.year} {profile.name}. All rights reserved.</p>

                <ul>
                    {footerLinks.map(({label, link }) => (
                        <li key={label}>
                            <a href={link} target={link.startsWith('http') ? '_blank' : undefined} rel="noreferrer">{label}</a>
                        </li>
                    ))}
                    <li>
                        <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Back to top ↑</button>
                    </li>
                </ul>
            </div>
        </footer>
    )
}
export default Footer
