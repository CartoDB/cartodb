export function fetchTags (context, parameters) {
  context.commit('setFetchingState');

  context.rootState.client.getTags(
    parameters,
    function (err, _, data) {
      if (err) {
        context.commit('setRequestError', err);
        return;
      }
      context.commit('setTags', data);
    });
}
