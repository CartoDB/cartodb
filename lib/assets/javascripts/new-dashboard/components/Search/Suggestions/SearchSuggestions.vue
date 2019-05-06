<template>
  <section class="suggestions" :class="{ 'suggestions--open': isOpen }" @mouseleave="resetActiveSuggestion">
    <ul v-if="searchResults" class="suggestions__content">
      <li :class="{'suggestions--active': activeSuggestionIndex === 0 }" @mouseover="updateActiveSuggestion(0)">
        <router-link
          class="suggestions__header is-caption text"
          :class="{ 'suggestions__header--loading': isFetching }"
          :to="{ name: searchRoute, params: searchRouteParameters }"
          :staticRoute="`/dashboard/search/${query}`"
          v-if="query"
          @click.native="onPageChange">
          {{ query }} <span v-if="!isFetching">- {{ searchResults.total_count }} results</span>
        </router-link>
      </li>
      <li v-for="(result, index) in searchResults.result" :key="result.id" :class="{'suggestions--active': activeSuggestionIndex === index + 1}"  @mouseover="updateActiveSuggestion(index + 1)">
        <SearchSuggestionsItem :item="result" @itemClick="onPageChange"/>
      </li>
    </ul>
  </section>
</template>

<script>
import _ from 'underscore';
import SearchSuggestionsItem from './SearchSuggestionsItem';
import CartoNode from 'carto-node';

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
      searchResults: {},
      client: new CartoNode.AuthenticatedClient(),
      activeSuggestionIndex: -1
    };
  },
  watch: {
    query (newQuery) {
      if (newQuery === '') {
        this.isFetching = false;
        this.searchResults = {};
        return;
      }

      this.isFetching = true;
      this.fetchSuggestionsDebounced();
      this.resetActiveSuggestion();
    }

  },
  computed: {
    searchRoute () {
      return 'search';
    },
    searchRouteParameters () {
      return { query: this.query };
    }
  },
  methods: {
    fetchSuggestions () {
      if (!this.query) {
        return;
      }

      this.client.previewSearch(this.query,

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
    },
    getActiveSuggestionElement () {
      return this.$el.querySelector('.suggestions--active .suggestions__item');
    },
    keydownDown () {
      if (this.activeSuggestionIndex < this.searchResults.result.length) {
        this.activeSuggestionIndex++;
      }
    },
    keydownUp () {
      if (this.activeSuggestionIndex > 0) {
        this.activeSuggestionIndex--;
      }
    },
    resetActiveSuggestion () {
      this.activeSuggestionIndex = -1;
    },
    updateActiveSuggestion (index) {
      this.activeSuggestionIndex = index;
    }
  }
};
</script>

<style lang="scss" scoped>
@import 'new-dashboard/styles/variables';

.suggestions {
  visibility: hidden;
  position: absolute;
  z-index: 2;
  top: 100%;
  left: 0;
  width: calc(100% - 16px);
  margin-top: 8px;
  border: 1px solid $border-color;
  border-radius: 2px;
  opacity: 0;
  background-color: $white;
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
  color: $primary-color;
  text-decoration: none;
  text-overflow: ellipsis;
  white-space: nowrap;

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

  &.suggestions__header--loading {
    padding-right: 38px;

    &::after {
      content: '';
      position: absolute;
      top: 50%;
      right: 12px;
      width: 18px;
      height: 18px;
      transform: translate3d(0, -50%, 0);
      background-image: url("../../../assets/icons/common/loading.svg");
      background-repeat: no-repeat;
      background-position: center;
    }
  }
}

.suggestions--active {
  .suggestions__header {
    background-color: rgba($primary-color, 0.05);
    text-decoration: underline;
  }
}

</style>
