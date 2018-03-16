function alphabetaDemo(startState) {
    const frames = [];

    const _keys = {}
    function captureFrame(key) {
        const clone = deepClone(startState)
        clone.id = key + ' ' + (_keys[key] = (_keys[key] || 0) + 1)
        frames.push(clone)
    }

    function maximizing(state, alpha, beta) {
        if (state.leaves && state.leaves.length > 0) {
            state.style = 'halflit';
            state.text = `[${alpha}, ${beta}]`
            captureFrame('maximizing pre');

            let value = -Infinity;
            for (let leafState of state.leaves) {
                value = Math.max(value, minimizing(leafState, alpha, beta));
                if (value >= beta) {
                    break;
                }
                alpha = Math.max(alpha, value)

                state.text = `[${alpha}, ${beta}]`
                captureFrame('maximizing leaf');
            }

            // highlight selected leaf's edge
            for (let leafState of state.leaves) {
                if (leafState.text === value) {
                    leafState.edgeStyle = 'lit';
                }
            }

            state.style = 'lit';
            state.text = value;
            // captureFrame('maximizing post');

            return value;
        } else {
            state.style = 'lit';

            return state.text || 0;
        }
    }

    function minimizing(state, alpha, beta) {
        if (state.leaves && state.leaves.length > 0) {
            state.style = 'halflit';
            state.text = `[${alpha}, ${beta}]`
            captureFrame('minimizing pre');

            let value = Infinity;
            for (let leafState of state.leaves) {
                value = Math.min(value, maximizing(leafState, alpha, beta));
                if (value <= alpha) {
                    break;
                }
                beta = Math.min(beta, value)

                state.text = `[${alpha}, ${beta}]`
                captureFrame('minimizing leaf');
            }

            // highlight selected leaf's edge
            for (let leafState of state.leaves) {
                if (leafState.text === value) {
                    leafState.edgeStyle = 'lit';
                }
            }

            state.style = 'lit';
            state.text = value;
            // captureFrame('minimizing post');

            return value;
        } else {
            state.style = 'lit';

            return state.text || 0;
        }
    }

    captureFrame('initial');

    maximizing(startState, -Infinity, Infinity);

    captureFrame('final');

    return frames;
}

$(document).ready(function () {
    uiSetup('alphabeta', alphabetaDemo);
})
