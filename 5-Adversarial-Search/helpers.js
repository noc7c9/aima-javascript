const defaultTree = {
    leaves: [
        {
            leaves: [
                { text: 6, },
                { text: 13, },
                { text: 8, },
            ],
        },
        {
            leaves: [
                { text: 1, },
                { text: 99, },
                { text: 100, },
            ],
        },
        {
            leaves: [
                { text: 14, },
                { text: 5, },
                { text: 2, },
            ],
        },
    ]
}

const defaultTreeSExpr = '((6 13 8) (1 99 100) (14 5 2))';
function sExprToTree(sExpr) {
    function parseSExpr(chars) {
        const result = [];
        let num = '';

        function saveNum() {
            if (num.length > 0) {
                result.push({
                    text: parseInt(num) || 0,
                });
                num = '';
            }
        }

        chars.shift()
        while (chars.length) {
            if (chars[0] === '(') {
                saveNum()

                result.push({
                    leaves: parseSExpr(chars),
                });
            } else if (chars[0] === ')') {
                saveNum()

                chars.shift();
                return result;
            } else if (chars[0] === ' ') {
                saveNum()

                chars.shift();
            } else {
                num += chars.shift();
            }
        }
        return result;
    }

    const root = {
        leaves: parseSExpr(sExpr.trim().split('')),
    }

    if (root.leaves.length > 0) {
        return root
    } else {
        return null
    }
}

function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function uiSetup(selectorPrefix, animFramesAlgorithm) {
    const $input = $(`#${selectorPrefix}Input`);
    const $slider = $(`#${selectorPrefix}Slider`);
    const $next = $(`#${selectorPrefix}Next`);
    const $prev = $(`#${selectorPrefix}Prev`);

    let tree = sExprToTree(defaultTreeSExpr);

    let animFrames;
    let currFrameIndex;

    function init() {
        animFrames = animFramesAlgorithm(tree);

        $slider
            .attr('min', 0)
            .attr('max', animFrames.length - 1)

        currFrameIndex = -1; // forces re-render
        displayFrame(0);
    }

    function displayFrame(frameIndex) {
        frameIndex = frameIndex === undefined ? currFrameIndex : frameIndex;
        frameIndex = Math.min(animFrames.length - 1, Math.max(0, frameIndex));

        if (frameIndex !== currFrameIndex) {
            currFrameIndex = frameIndex;

            $slider.get(0).value = frameIndex;

            d3TreeRender(`#${selectorPrefix}Canvas`, animFrames[frameIndex]);
            // console.log('displaying frame:', animFrames[frameIndex].id)
        }
    }

    $input.get(0).value = defaultTreeSExpr;

    $input.on('input', function () {
        const newTree = sExprToTree(this.value)
        if (newTree) {
            tree = newTree;
            init();
        }
    });
    $slider.on('input', function () {
        displayFrame(parseInt(this.value))
    })
    $prev.on('click', () => displayFrame(currFrameIndex - 1));
    $next.on('click', () => displayFrame(currFrameIndex + 1));

    init();
}
