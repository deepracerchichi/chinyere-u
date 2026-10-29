import {articles} from "../constants";
import SectionTitle from "./SectionTitle.jsx";

const Articles = () => (
    <section id="articles">
        <SectionTitle lines={["Things", "I've written"]} count={articles.length} />

        <div className="list">
            {articles.map(({ id, date, tag, title, summary, link }, i) => (
                <a
                    key={id}
                    href={link}
                    className="article"
                    target={link.startsWith('http') ? '_blank' : undefined}
                    rel="noreferrer"
                    data-reveal
                    data-rule
                    style={{ '--i': i }}
                >
                    <time>{date}</time>
                    <div>
                        <h3>{title}</h3>
                        <p>{summary}</p>
                    </div>
                    <span className="tag">{tag} ↗</span>
                </a>
            ))}
        </div>
    </section>
)
export default Articles
