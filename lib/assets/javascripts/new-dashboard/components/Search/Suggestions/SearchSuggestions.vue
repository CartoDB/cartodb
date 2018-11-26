<template>
  <section class="suggestions" :class="{ 'suggestions--open': isOpen }">
    <ul class="suggestions__content" v-if="searchResults">
      <li v-for="visualization in searchResults" :key="visualization.id">
        <SearchSuggestionsItem :item="visualization" />
      </li>
    </ul>
    <router-link :to="{ name: 'search', params: { query } }" class="suggestions__search-all title is-small" v-if="query && !isFetching">
      View all results
    </router-link>
  </section>
</template>

<script>
import _ from 'underscore';
import CartoNode from 'carto-node';
import SearchSuggestionsItem from './SearchSuggestionsItem';

const client = new CartoNode.AuthenticatedClient();
const DEBOUNCE_TIME = 500;

export default {
  name: 'SearchSuggestions',
  components: {
    SearchSuggestionsItem
  },
  props: {
    query: String,
    isOpen: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      isFetching: true,
      searchResults: []
    };
  },
  created () {
    this.fetchSuggestionsDebounced = _.debounce(() => this.fetchSuggestions(), DEBOUNCE_TIME);
    this.fetchSuggestions();
  },
  watch: {
    query (newQuery) {
      this.isFetching = true;
      this.fetchSuggestionsDebounced();
    }
  },
  methods: {
    fetchSuggestions () {
      client.getVisualization('',
        { types: 'derived,table', q: this.query, per_page: 4 },
        (err, _, data) => {
          this.isFetching = false;

          if (err) {
            return;
          }

          this.searchResults = data.visualizations;
        }
      );
    }
  }
};
</script>

<style lang="scss" scoped>
@import 'stylesheets/new-dashboard/variables';

.suggestions {
  visibility: hidden;
  position: absolute;
  z-index: 2;
  top: 100%;
  left: 0;
  width: calc(100% - 16px);
  margin-top: 8px;
  border: 1px solid $light-grey;
  border-radius: 2px;
  opacity: 0;
  background-color: #FFF;
  pointer-events: none;

  &.suggestions--open,
  &:hover {
    visibility: visible;
    opacity: 1;
    pointer-events: auto;
  }
}

.suggestions__content {
  padding: 0 16px;
}

.suggestions__search-all {
  display: block;
  padding: 16px;
  background-color: $softblue;
  color: $primary-color;
  letter-spacing: 1px;
  text-transform: uppercase;

  &:hover {
    text-decoration: none;
  }
}
</style>
