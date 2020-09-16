<template>
  <div class="filter-summary" :class="{ highlight: showDetails }">
    <div class="header">
      <div class="entities-count title">
        <span class="is-caption is-txtNavyBlue">{{ count }}</span>
        <span class="is-txtMidGrey is-small"> datasets</span>
      </div>
      <div class="filters-count" :class="{ 'filter-selector': filtersCount }">
        <button
          class="title is-small is-navyBlue u-mr--12 u-mr--0--tablet detail-button"
          @click="toggleDetails()"
        >
          <img
            class="u-mr--12 expand-icon"
            :src="icon_by_environment('arrow-blue.svg')"
            alt="Expand"
          />
          {{ filtersCount }} <span>filters applied</span>
        </button>
        <div class="u-hideTablet u-inlineflex">
          <Button
            :isOutline="true"
            :extraBorder="true"
            @click.native="clearFilters"
            :narrow="true"
            >Clear all</Button
          >
        </div>
      </div>
    </div>
    <transition
      name="slide"
      @enter="enter"
      @after-enter="afterEnter"
      @leave="leave"
      @after-leave="afterLeave"
    >
      <div class="extra-container" v-if="showDetails">
        <FilterDetail
          v-for="[filterKey, filterContent] in filtersApplied"
          :key="filterKey"
          :filterId="filterKey"
          :filters="filterContent"
        ></FilterDetail>
      </div>
    </transition>
    <div
      v-if="showFilterSuggestions && filterSuggestion && filterSuggestion.option.entity_count !== '0'"
      class="filter-suggestion grid grid--no-wrap grid--align-center grid--space text is-small"
    >
      <p>
        You can find
        <strong class="is-semibold"
          >{{ filterSuggestion.option.entity_count }} more datasets</strong
        >
        in the
        <em class="is-italic">{{ filterSuggestion.option.name }}</em> option
        from the {{ getFilterLabel(filterSuggestion.category) }} list.
        <button
          class="text is-small is-semibold is-txtPrimary"
          @click="activeSuggestedFilter(filterSuggestion)"
        >
          Include {{ filterSuggestion.option.name }} datasets
        </button>
      </p>
      <button @click="closeFilterSuggestion()">
        <img src="../../../assets/icons/catalog/close-suggestion.svg" alt="Close" />
      </button>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import FilterDetail from './FilterDetail';
import Button from '../../Button.vue';
import { filtersMetadata } from 'new-dashboard/utils/catalog/constants';
import { toTitleCase } from 'new-dashboard/utils/catalog/string-to-title-case';
import icon_by_environment from 'new-dashboard/mixins/catalog/icon_by_environment';

export default {
  name: 'FilterSummary',
  mixins: [icon_by_environment],
  components: {
    FilterDetail,
    Button
  },
  data () {
    return {
      showDetails: false,
      showFilterSuggestions: true
    };
  },
  computed: {
    ...mapState({
      count: state => state.catalog.datasetsListCount,
      filter: state => state.catalog.filter.categories,
      filtersAvailable: state => state.catalog.filtersAvailable
    }),
    filtersApplied () {
      const filterMap = new Map();
      for (let filterId in this.filtersAvailable) {
        if (this.filter[filterId]) {
          const filterContent = this.filter[filterId].map(item => {
            const filterAvailable = this.filtersAvailable[filterId].get(item.id);
            return {
              id: item.id,
              name: item.name || filterAvailable && filterAvailable.name
            };
          });
          if (filterContent.length) {
            filterMap.set(filterId, filterContent);
          }
        }
      }
      // Sort filters
      return new Map(
        [...filterMap].sort((a, b) => {
          return filtersMetadata[a[0]].order - filtersMetadata[b[0]].order;
        })
      );
    },
    filtersCount () {
      let filterCount = 0;
      for (let filterId in this.filtersAvailable) {
        if (this.filter[filterId]) {
          filterCount += this.filter[filterId].length;
        }
      }
      return filterCount;
    },
    highlightedFilters () {
      const filterMap = {};
      for (let filterId in this.filtersAvailable) {
        filterMap[filterId] = new Map();
        this.filtersAvailable[filterId].forEach((filter, key) => {
          if (filter.highlighted) {
            filterMap[filterId].set(key, filter);
          }
        });
      }
      return filterMap;
    },
    filterSuggestion () {
      for (let key of [...this.filtersApplied.keys()]) {
        if (this.highlightedFilters[key]) {
          const highlightedFilterKeys = [
            ...this.highlightedFilters[key].keys()
          ];
          if (highlightedFilterKeys.length) {
            const containsHighlightedFilter = this.filtersApplied
              .get(key)
              .some(filter => highlightedFilterKeys.includes(filter.id));
            if (!containsHighlightedFilter) {
              return {
                option: this.highlightedFilters[key].get(
                  highlightedFilterKeys[0]
                ),
                category: key
              };
            }
          }
        }
      }
      return undefined;
    }
  },
  watch: {
    filtersCount (newValue) {
      if (newValue === 0) {
        this.showDetails = false;
      }
    }
  },
  methods: {
    toggleDetails () {
      this.showDetails = !this.showDetails;
      this.$emit('toggle-filter-detail');
    },
    clearFilters () {
      this.$store.dispatch('catalog/clearTagFilters');
    },
    getFilterLabel (filterId) {
      return filtersMetadata[filterId]
        ? filtersMetadata[filterId].label
        : toTitleCase(filterId);
    },
    closeFilterSuggestion () {
      this.showFilterSuggestions = false;
    },
    activeSuggestedFilter (suggestedFilter) {
      const newFilter = {};
      const currentFilter = this.$store.state.catalog.filter.categories[suggestedFilter.category];
      newFilter[suggestedFilter.category] = [
        ...currentFilter,
        {
          id: suggestedFilter.option.id,
          name: suggestedFilter.option.name
        }
      ];
      this.$store.commit('catalog/setFilter', newFilter);
    },

    // Vue transition to force precalculate height
    enter (el) {
      el.style.overflow = 'hidden';
      el.style.height = '0';

      window.requestAnimationFrame(() => {
        el.style.height = `${el.scrollHeight}px`;
      });
    },
    leave (el) {
      el.style.overflow = 'hidden';
      el.style.height = `${el.scrollHeight}px`;

      window.requestAnimationFrame(() => {
        el.style.height = '0';
      });
    },
    afterEnter (el) {
      el.style.height = '';
      el.style.overflow = '';
    },
    afterLeave (el) {
      el.style.height = '';
      el.style.overflow = '';
    }
  }
};
</script>

<style lang="scss" scoped>
@import 'new-dashboard/styles/variables';

.filter-summary {
  transition: box-shadow 0.2s ease-out;
  border-radius: 8px;
  background-color: $white;
  box-shadow: 0 0 0 0 transparent;

  .header {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 12px 12px 12px 24px;

    @media (max-width: $layout-tablet) {
      padding-right: 0;
      padding-left: 0;
    }
  }

  .extra-container {
    width: 100%;
    padding: 0 12px;
    border-radius: 0 0 8px 8px;
    background: $white;
  }

  @media (min-width: $layout-tablet) {
    &.highlight {
      box-shadow: 0 4px 16px 0 rgba($neutral--800, 0.16);

      .expand-icon {
        transform: rotate(180deg);
      }
    }
  }
}

.detail-button {
  padding: 8px 16px 8px 12px;
  border-radius: 4px;
  cursor: pointer;

  &:focus {
    outline: none;
    box-shadow: none;
  }

  &.highlight-header {
    box-shadow: 0 4px 16px 0 rgba($neutral--800, 0.16);

    .expand-icon {
      transform: rotate(180deg);
    }
  }

  &:hover {
    background-color: $blue--100;
  }
}

.expand-enter-active,
.expand-leave-active {
  overflow: hidden;
  transition: height 0.2s ease-out;
}

.expand-enter,
.expand-leave-to {
  height: 0;
}

// Vue transition
$animationTimming: 250ms;
$animationFunc: ease;

.slide-enter-active {
  transition: height $animationTimming $animationFunc,
    opacity $animationTimming $animationFunc $animationTimming/3;
}

.slide-leave-active {
  transition: height $animationTimming $animationFunc,
    opacity $animationTimming $animationFunc;
}

.slide-enter,
.slide-leave-to {
  opacity: 0;
  margin: 0;
}

.filters-count {
  display: none;

  &.filter-selector {
    display: block;
  }

  @media (max-width: $layout-tablet) {
    display: block;
  }
}

.filter-suggestion {
  padding: 8px 12px 8px 24px;
  background-color: $neutral--100;
  color: $navy-blue;

  button {
    cursor: pointer;
  }
}

@media (max-width: $layout-tablet) {
  .extra-container {
    display: none;
  }
  .detail-button {
    padding: 0;
  }
}
</style>
