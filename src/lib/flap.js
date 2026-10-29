import gsap from "gsap";

// Split-flap letters. Each cell is four layers: the new top half (static), the old bottom half (static),
// the old top half (hinged at its bottom edge, falls away) and the new bottom half (hinged at its top edge, swings in).
export const CHARS = ' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:-.&/';

const stepFlip = (cell, ch, done) => {
    cell.topI.textContent = ch;
    cell.backI.textContent = ch;
    gsap.set(cell.front, { rotateX: 0 });
    gsap.set(cell.back, { rotateX: 90 });
    gsap.timeline({
        onComplete: () => {
            cell.botI.textContent = ch;
            cell.frontI.textContent = ch;
            gsap.set(cell.front, { rotateX: 0 });
            gsap.set(cell.back, { rotateX: 90 });
            cell.cur = ch;
            done();
        },
    })
        .to(cell.front, { rotateX: -90, duration: 0.06, ease: 'power1.in' })
        .to(cell.back, { rotateX: 0, duration: 0.06, ease: 'power1.out' });
};

export const makeCell = (el) => ({
    el,
    cur: ' ',
    token: 0,
    topI: el.querySelector('.top i'),
    botI: el.querySelector('.bottom i'),
    frontI: el.querySelector('.front i'),
    backI: el.querySelector('.back i'),
    front: el.querySelector('.front'),
    back: el.querySelector('.back'),
});

export const showNow = (cell, ch) => {
    cell.token++;
    cell.cur = ch;
    cell.topI.textContent = cell.botI.textContent = cell.frontI.textContent = cell.backI.textContent = ch;
};

// Cycle through the characters in between, like the real thing (capped so it stays snappy).
export const flipTo = (cell, target, delayMs = 0) => {
    const L = CHARS.length;
    const ti = Math.max(0, CHARS.indexOf(target));
    const ci = CHARS.indexOf(cell.cur);
    if (ti === ci) return;
    const steps = Math.min((ti - ci + L) % L, 5 + Math.floor(Math.random() * 8));
    const seq = [];
    for (let k = steps - 1; k >= 0; k--) seq.push(CHARS[(ti - k + L) % L]);
    const mine = ++cell.token;
    let i = 0;
    const next = () => {
        if (mine !== cell.token || i >= seq.length) return;
        stepFlip(cell, seq[i++], next);
    };
    gsap.delayedCall(delayMs / 1000, next);
};
