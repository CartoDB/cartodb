<template>
  <section class="suggestions" :class="{ 'suggestions--open': isOpen }">
    <ul class="suggestions__content" v-if="searchResults">
      <li v-for="visualization in searchResults" :key="visualization.id">
        <SearchSuggestionsItem :item="visualization" @itemClick="onPageChange" />
      </li>
    </ul>
    <router-link
      :to="{ name: searchRoute, params: searchRouteParameters }"
      class="suggestions__search-all title is-small"
      v-if="query"
      @click="onPageChange">
      View all results
    </router-link>
  </section>
</template>

<script>
import _ from 'underscore';
import CartoNode from 'carto-node';
import SearchSuggestionsItem from './SearchSuggestionsItem';

const client = new CartoNode.AuthenticatedClient();
const DEBOUNCE_TIME = 1000;

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
  created () {
    this.fetchSuggestionsThrottled = _.throttle(this.fetchSuggestions.bind(this), DEBOUNCE_TIME);
  },
  data () {
    return {
      isFetching: true,
      searchResults: []
    };
  },
  watch: {
    query (newQuery) {
      if (newQuery === '') {
        this.isFetching = false;
        this.searchResults = [];
        return;
      }

      this.isFetching = true;
      this.fetchSuggestionsThrottled();
    }
  },
  computed: {
    isSearchingTags () {
      return this.query.includes(':');
    },
    searchRoute () {
      if (this.isSearchingTags) {
        return 'tagSearch';
      }

      return 'search';
    },
    searchRouteParameters () {
      if (this.isSearchingTags) {
        return { tag: this.query.substring(1) };
      }

      return { query: this.query };
    },
    queryParameters () {
      const queryParameters = {
        types: 'derived,table',
        per_page: 4
      };

      if (this.isSearchingTags) {
        queryParameters.tags = this.query.substring(1);
      }

      if (!this.isSearchingTags) {
        queryParameters.q = this.query;
      }

      return queryParameters;
    }
  },
  methods: {
    fetchSuggestions () {
      client.getVisualization('',
        this.queryParameters,

        (err, _, data) => {
          this.isFetching = false;

          if (err) {
            return;
          }

          this.searchResults = data.visualizations;
        }
      );
    },
    onPageChange () {
      this.$emit('pageChange');
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
