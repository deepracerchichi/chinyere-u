import {useEffect, useRef, useState} from "react";

// True once the element has scrolled into view (one-shot).
// Uses IntersectionObserver, so it never depends on pre-measured scroll positions.
const useInView = (threshold = 0.35) => {
    const ref = useRef(null);
    const [inView, setInView] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        if (!('IntersectionObserver' in window)) {
            setInView(true);
            return;
        }

        const io = new IntersectionObserver(([entry]) => {
            // also counts as seen when the user jumped past it (anchor links)
            if (entry.isIntersecting || entry.boundingClientRect.top < 0) {
                setInView(true);
                io.disconnect();
            }
        }, { threshold });

        io.observe(el);
        return () => io.disconnect();
    }, [threshold]);

    return [ref, inView];
};

export default useInView;
