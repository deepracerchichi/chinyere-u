import {services} from "../constants";
import SectionTitle from "./SectionTitle.jsx";

const Services = () => (
    <section id="services">
        <div className="intro">
            <SectionTitle lines={['What', 'I do']} />
        </div>

        <ol className="svc-list">
            {services.map(({ id, title, text }, i) => (
                <li key={id} className="svc" data-reveal data-rule style={{ '--i': i }}>
                    <span className="num">{String(id).padStart(2, '0')}</span>
                    <div>
                        <h3>{title}</h3>
                        <p>{text}</p>
                    </div>
                </li>
            ))}
        </ol>
    </section>
)
export default Services
