function StartNodeSelectBox(selector) {
    const $selectBox = $(selector);
    let startNode;

    this.refresh = function (nodes, selectedId) {
        $selectBox.empty();

        for (let node of Object.values(nodes)) {
            const $option = $('<option>')
                .attr('value', node.id)
                .attr('selected', node.id == selectedId)
                .text(node.text)

            $selectBox
                .append($option)
        }
    }

    this.get = function (defValue) {
        return startNode || defValue;
    }

    this.onChange = function (cb) {
        $selectBox.on('change', function () {
            startNode = $(this).val();
            cb();
        });
    }
}
