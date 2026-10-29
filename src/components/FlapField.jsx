const Cell = () => (
    <span className="cell" aria-hidden="true">
        <span className="half top"><i>{' '}</i></span>
        <span className="half bottom"><i>{' '}</i></span>
        <span className="flap front"><i>{' '}</i></span>
        <span className="flap back"><i>{' '}</i></span>
    </span>
)

// A run of `len` flip-letters. `target` is the text it should flip to; the board does the flipping.
const FlapField = ({ name, len, target }) => (
    <span className={`field col-${name}`} data-field={name} data-len={len} data-target={target}>
        {Array.from({ length: len }, (_, i) => <Cell key={i} />)}
    </span>
)
export default FlapField
