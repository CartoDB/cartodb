const noop = () => {};

/**
 * Helper for testing action with expected mutations inspired in
 * https://vuex.vuejs.org/en/testing.html
 *
 * @param {Function} action to be tested
 * @param {Object} payload will be provided to the action
 * @param {Object} state will be provided to the action
 * @param {Array} [expectedMutations=[]] mutations expected to be committed
 * @param {Array} [expectedActions=[]] actions expected to be dispatched
 * @param {Function} [done=noop] to be executed after the tests
 * @param {Object} [rootstate=state] rootstate provided to the action, when not given will fallback state.
 * @return {Promise}
 *
 */
export function testAction ({ action, payload, state = {}, getters = {}, expectedMutations = [], expectedActions = [], rootState = {}, done = noop }) {
  if (typeof action === 'undefined') {
    throw new Error('Store Action is undefined');
  }

  rootState = rootState || state;

  const mutations = [];
  const actions = [];

  // mock commit
  const commit = (type, mutationPayload) => {
    const mutation = { type };

    if (typeof mutationPayload !== 'undefined') {
      mutation.payload = mutationPayload;
    }

    mutations.push(mutation);
  };

  // mock dispatch
  const dispatch = (type, actionPayload) => {
    const dispatchedAction = { type };

    if (typeof actionPayload !== 'undefined') {
      dispatchedAction.payload = actionPayload;
    }

    actions.push(dispatchedAction);
  };

  const validateResults = () => {
    expect({
      mutations,
      actions
    }).toEqual({
      mutations: expectedMutations,
      actions: expectedActions
    });
    done();
  };

  const result = action({ commit, state, dispatch, getters, rootState, rootGetters: state }, payload);

  return new Promise(resolve => {
    setImmediate(resolve);
  })
    .then(() => result)
    .catch(error => {
      validateResults();
      throw error;
    })
    .then(data => {
      validateResults();
      return data;
    });
}
