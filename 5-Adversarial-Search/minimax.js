function minimaxDemo(startState) {
    const frames = [];

    function captureFrame() {
        frames.push(deepClone(startState))
    }

    function recurse(state, minmaxFactor) {
        if (state.leaves && state.leaves.length > 0) {
            state.style = 'halflit';
            captureFrame();

            const leafValues = state.leaves
                .map((state) => minmaxFactor * recurse(state, -minmaxFactor))

            const stateValue = minmaxFactor * Math.max.apply(null, leafValues);

            // highlight selected leaf's edge
            state.leaves.map(function (state) {
                if (state.text === stateValue) {
                    state.edgeStyle = 'lit';
                }
            })

            state.style = 'lit';
            state.text = stateValue;
            captureFrame();

            return stateValue;
        } else {
            state.style = 'lit';
            captureFrame();

            return state.text || 0;
        }
    }

    captureFrame();
    const finalValue = recurse(startState, 1);

    return frames;
}

$(document).ready(function () {
    uiSetup('minimax', minimaxDemo);
})
