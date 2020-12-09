<template>
  <div class="filter-box" :class="{ 'is-compressed': isCompressed }">
    <div class="filter-header" @click="toggleVisibility">
      <div class="expand-button u-flex u-flex__align--center u-flex__justify--center u-mr--12">
        <img src="../../../assets/icons/catalog/arrow-navy.svg" alt="Expand" />
      </div>
      <div>
        <h3 class="title is-caption">{{ title }}</h3>
        <p class="title is-small u-pt--4" v-if="currentFilter.length">
          {{
            currentFilter.length > 1
              ? `${currentFilter.length} filters`
              : `${currentFilter.length} filter`
          }}
          <span>·</span>
          <button class="title is-small clear-button" @click.stop="clearFilter">
            Clear
          </button>
        </p>
      </div>
    </div>
    <div class="filter-options">
      <div v-if="options.size > 10" class="options-filter u-mb--4">
        <input
          class="filter-input text is-small"
          type="text"
          :placeholder="`Find a ${placeholder}`"
          v-model="filterText"
        />
        <button v-if="filterText.length" @click="clearOptionsFilter">
          <img src="../../../assets/icons/catalog/clear-search.svg" alt="Clear" title="Clear" />
        </button>
      </div>
      <div class="filter-content">
        <p
          class="text is-caption center"
          v-if="!filteredOptions.length && !loading"
        >
          Not found
        </p>
        <label
          class="text is-caption"
          :class="{ highlighted: option.highlighted }"
          v-for="option in filteredOptions"
          :key="option.id"
        >
          <span class="checkbox u-mr--12">
            <input
              class="checkbox-input"
              type="checkbox"
              name="option.id"
              :checked="currentFilter.find(f => f.id === option.id)"
              @change="filterChanged($event, option)"
            />
            <span class="checkbox-decoration">
              <svg
                viewBox="0 0 12 12"
                svg-inline=""
                role="presentation"
                focusable="false"
                tabindex="-1"
                class="checkbox-decorationMedia"
              >
                <path
                  d="M1.65 3.803l2.84 3.169L10.38.717"
                  fill="none"
                  class="checkbox-check"
                ></path>
              </svg>
            </span>
          </span>
          <span>
            {{ option.name }}
            <span class="is-txtMidGrey is-small" v-if="option.entity_count"
              >({{ option.entity_count }})</span
            >
          </span>
        </label>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex';

export default {
  name: 'FilterBox',
  props: {
    title: String,
    filter: String,
    placeholder: String
  },
  data () {
    return {
      // model: new Set(),
      filterText: '',
      isCompressed: false
    };
  },
  computed: {
    ...mapState({
      filtersAvailable: state => state.catalog.filtersAvailable,
      loading: state => state.catalog.isFetching,
      currentFilter (state) {
        return state.catalog.filter.categories[this.filter] || [];
      }
    }),
    options () {
      return this.filtersAvailable[this.filter] || new Map();
    },
    filteredOptions () {
      const lowercaseFilter = this.filterText.toLowerCase();
      return [...this.options.values()]
        .filter(opt => opt.entity_count > 0 && opt.name.toLowerCase().includes(lowercaseFilter))
        .sort((a, b) => {
          if (a.highlighted === b.highlighted) {
            if (a.entity_count !== b.entity_count) {
              return b.entity_count - a.entity_count;
            } else {
              return a.name !== b.name
                ? a.name < b.name
                  ? -1
                  : 1
                : 0;
            }
          } else if (a.highlighted) {
            return -1;
          } else {
            return 1;
          }
        });
    }
  },
  methods: {
    filterChanged (event, option) {
      const newFilter = {};
      newFilter[this.filter] = [...this.currentFilter];
      if (newFilter[this.filter].find(f => f.id === option.id)) {
        newFilter[this.filter] = newFilter[this.filter].filter(f => f.id !== option.id);
      } else {
        newFilter[this.filter].push({ id: option.id, name: option.name });
      }
      this.$store.commit('catalog/setFilter', newFilter);
    },
    clearFilter () {
      const newFilter = {};
      newFilter[this.filter] = [];
      this.$store.commit('catalog/setFilter', newFilter);
    },
    clearOptionsFilter () {
      this.filterText = '';
    },
    toggleVisibility () {
      this.isCompressed = !this.isCompressed;
    }
  },
  watch: {
    filteredOptions: {
      immediate: true,
      handler (newValue, oldValue) {
        if (!newValue.length && !this.loading) {
          this.isCompressed = true;
        } else if (oldValue && !oldValue.length && newValue.length && !this.loading) {
          this.isCompressed = false;
        }
      }
    }
  }
};
</script>

<style lang="scss" scoped>
@import 'new-dashboard/styles/variables';

.center {
  text-align: center;
}

.filter-box {
  border-bottom: 1px solid $neutral--400;

  .filter-header {
    display: flex;
    align-items: center;
    // TODO: REVIEW
    padding: 16px 0 16px 16px;
    height: 72px;
    padding-left: 20px;
    cursor: pointer;

    &:hover {
      background-color: $blue--100;
    }
  }

  .filter-content {
    height: 100%;
    padding: 16px;
    overflow-y: auto;

    label {
      display: flex;
      margin-bottom: 16px;
      cursor: pointer;
      color: $navy-blue;

      &.highlighted + label:not(.highlighted) {
        padding-top: 16px;
        border-top: 1px solid
          transparentize($color: $neutral--400, $amount: 0.5);
      }
    }
  }

  .filter-options {
    display: flex;
    flex-direction: column;
    max-height: 268px;
    overflow: hidden;

    .options-filter {
      display: flex;
      flex-direction: row;
      flex-shrink: 0;
      border: 2px solid transparent;
      border-radius: 4px;
      background-color: $neutral--100;

      &:focus-within {
        border-color: $color-primary;

        &,
        input {
          background-color: $white;
        }
      }

      input {
        flex: 1 1 auto;
        outline: none;
      }

      button {
        display: flex;
        align-items: center;
        justify-content: center;
        flex: 0 0 auto;
        margin-right: 6px;
        outline: none;
        cursor: pointer;

        img {
          height: 16px;
          width: 16px;
        }
      }
    }
  }

  .expand-button {
    width: 24px;
    height: 24px;
  }

  &.is-compressed {
    .filter-options {
      max-height: 0;
    }

    .expand-button {
      transform: rotate(-90deg);
    }
  }
}

.clear-button {
  color: $color-primary;
  cursor: pointer;
  padding-left: 6px;
}

.filter-input {
  width: 100%;
  height: 36px;
  padding: 10px 12px 10px 36px;
  border: 0;
  border-radius: 4px;
  background-color: $neutral--100;
  background-image: url('../../../assets/icons/catalog/search-placeholder.svg');
  background-repeat: no-repeat;
  background-position: left 12px center;

  &::placeholder {
    opacity: 1;
    color: $neutral--600;
  }
}
</style>
