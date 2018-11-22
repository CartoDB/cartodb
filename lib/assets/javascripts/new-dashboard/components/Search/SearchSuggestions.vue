<template>
  <section class="suggestions" :class="{ 'suggestions--open': isOpen }">
    <ul>
      <li v-for="visualization in searchResults" :key="visualization.id">
        {{ visualization.name }}
      </li>
    </ul>
  </section>
</template>

<script>
import _ from 'underscore';
import CartoNode from 'carto-node';

const client = new CartoNode.AuthenticatedClient();
const DEBOUNCE_TIME = 500;

export default {
  name: 'SearchSuggestions',
  props: {
    query: String,
    isOpen: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      searchResults: []
    };
  },
  created () {
    this.fetchSuggestionsDebounced = _.debounce(() => this.fetchSuggestions(), DEBOUNCE_TIME);
    this.fetchSuggestions();
  },
  watch: {
    query (newQuery) {
      this.fetchSuggestionsDebounced();
    }
  },
  methods: {
    fetchSuggestions () {
      client.getVisualization('',
        { types: 'derived,table', q: this.query, per_page: 4 },
        (err, _, data) => {
          if (err) {
            return;
          }

          this.searchResults = data.visualizations;
        }
      );
    },

    goToSearch () {
      this.$router.push({ name: 'search' });
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
  width: 100%;
  margin-top: 8px;
  border: 1px solid $light-grey;
  border-radius: 2px;
  opacity: 0;
  background-color: #FFF;
  pointer-events: none;

  &.suggestions--open {
    visibility: visible;
    opacity: 1;
    pointer-events: auto;
  }
}
</style>
