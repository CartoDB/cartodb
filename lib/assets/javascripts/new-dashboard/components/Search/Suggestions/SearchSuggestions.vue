<template>
  <section class="suggestions" :class="{ 'suggestions--open': isOpen }">
    <router-link
      :to="{ name: searchRoute, params: searchRouteParameters }"
      class="suggestions__header is-caption text"
      :class="{ 'suggestions--loading': isFetching }"
      v-if="query"
      @click="onPageChange">
      {{ query }} <span v-if="!isFetching">- {{ searchResults.total_entries }} results</span>
    </router-link>

    <ul v-if="searchResults" class="suggestions__content">
      <li v-for="visualization in searchResults.visualizations" :key="visualization.id">
        <SearchSuggestionsItem :item="visualization" @itemClick="onPageChange" />
      </li>
    </ul>
  </section>
</template>

<script>
import _ from 'underscore';
import SearchSuggestionsItem from './SearchSuggestionsItem';

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
    this.fetchSuggestionsDebounced = _.debounce(this.fetchSuggestions.bind(this), 500);
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
      this.fetchSuggestionsDebounced();
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
      this.$store.state.client.getVisualization('',
        this.queryParameters,

        (err, _, data) => {
          this.isFetching = false;

          if (err) {
            return;
          }

          this.searchResults = data;
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

.suggestions__header {
  display: block;
  position: relative;
  width: 100%;
  padding: 16px 16px 16px 38px;
  overflow: hidden;
  border-bottom: 1px solid $grey;
  color: $text-color;
  text-overflow: ellipsis;
  white-space: nowrap;

  &:hover {
    background-color: rgba($primary-color, 0.05);
    color: #1785FB;
    text-decoration: none;
  }

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 12px;
    width: 18px;
    height: 18px;
    transform: translate3d(0, -50%, 0);
    background-image: url("../../../assets/icons/navbar/dropdown/loupe-dropdown.svg");
    background-repeat: no-repeat;
    background-position: center;
  }

  &.suggestions--loading {
    padding-right: 38px;

    &::after {
      content: '';
      position: absolute;
      top: 50%;
      right: 12px;
      width: 18px;
      height: 18px;
      transform: translate3d(0, -50%, 0);
      background-image: url("../../../assets/icons/navbar/search/loading.svg");
      background-repeat: no-repeat;
      background-position: center;
    }
  }
}
</style>
