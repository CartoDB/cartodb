
export function setTags (state, tagsData) {
  state.tags.results = tagsData.result;
  state.tags.numResults = tagsData.total;
  state.tags.numPages = Math.ceil(tagsData.total / state.resultsPerPage);

  state.tags.isFetching = false;
}
