const defaultTree = {
    text: 'l0',
    leaves: [
        {
            text: 'l1-1',
            leaves: [
                { text: 'l2-1', },
                { text: 'l2-2', },
                {
                    text: 'l2-3',
                    leaves: [
                        { text: 'l3-1', },
                        { text: 'l3-2', },
                        { text: 'l3-3', },
                        { text: 'l3-1', },
                        { text: 'l3-2', },
                        { text: 'l3-3', },
                        { text: 'l3-1', },
                        { text: 'l3-2', },
                        { text: 'l3-3', },
                    ]
                },
            ],
        },
        {
            text: 'l1-2',
            leaves: [
                { text: 'l2-4', },
                { text: 'l2-5', },
                { text: 'l2-6', },
            ],
        },
        {
            text: 'l1-3',
            leaves: [
                { text: 'l2-7', },
                { text: 'l2-8', },
                { text: 'l2-9', },
            ],
        },
    ]
}

function minimaxInit() {
    d3TreeRender('#minimaxCanvas', defaultTree);
}

$(document).ready(function () {
    minimaxInit();
})

// Code for minimax
function MAX_DECISION(state) {
	var action_list = actions(state);
	var final_action = undefined;
	var largest_value = 0;
	for (var action = 0; action < action_list.length; i++){
		var res = MIN_VALUE(RESULT(state, action_list[action]));
		if  (largest_value < res) {
			largest_value = res;
			final_action = action;
		}
	}
	return final_action;
}
function MAX_VALUE(state) {
	if (terminal(state))
		return utillity(state);
	var largest_value = 0;
	var action_list = actions(state);
	for (var action = 0; action < action_list.length; i++)
		largest_value = Math.max(largest_value, MIN_VALUE(RESULT(state, action_list[action])));
	return largest_value;
}
function MIN_VALUE(state) {
	if (terminal(state))
		return utillity(state);
	var smallest_value = Number.MAX_SAFE_INTEGER;
	var action_list = actions(state);
	for (var action = 0; action < action_list.length; action++)
		smallest_value = Math.min(smallest_value, MAX_VALUE(RESULT(state, action_list[action])));
	return smallest_value;
}
