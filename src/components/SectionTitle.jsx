import {Fragment} from "react";
import useInView from "../hooks/useInView.js";

// Big section heading. Each line slides up out of its own mask when scrolled into view.
const SectionTitle = ({ lines, count }) => {
    const [ref, inView] = useInView(0.35);

    return (
        <h2 ref={ref} className={`title${inView ? ' in' : ''}`}>
            {lines.map((line, i) => (
                <Fragment key={line}>
                    <span className="ln">
                        <span style={{ transitionDelay: `${i * 80}ms` }}>{line}</span>
                    </span>{' '}
                </Fragment>
            ))}
            {count !== undefined && <span className="count">({String(count).padStart(2, '0')})</span>}
        </h2>
    )
}
export default SectionTitle
