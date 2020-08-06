<template>
  <div class="search-box" :class="{ 'active-search': filterText.length }">
    <input
      type="text"
      class="text is-caption"
      placeholder="Search datasets by title or description"
      v-model="filterText"
      v-on:keyup.enter="updateFilter"
    />
    <button class="clear-search" v-if="filterText.length" @click="clearFilter">
      <img src="../../../assets/icons/catalog/clear-search.svg" alt="Clear" title="Clear" />
    </button>
    <button
      class="search-button"
      :class="{ 'filled-button': filterText.length }"
      @click="updateFilter"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M23.36 20.276l-4.318-4.32a10.276 10.276 0 001.656-5.608 10.274 10.274 0 00-3.032-7.316A10.28 10.28 0 0010.348 0a10.28 10.28 0 00-7.316 3.03A10.283 10.283 0 000 10.349a10.28 10.28 0 003.032 7.318 10.277 10.277 0 007.316 3.03c1.99.005 3.94-.57 5.609-1.654l4.319 4.319c.412.412.96.639 1.542.639.583 0 1.13-.227 1.543-.64.412-.41.639-.958.639-1.542 0-.583-.227-1.131-.64-1.542zM4.575 16.12a8.108 8.108 0 01-2.392-5.773c0-2.181.85-4.231 2.392-5.773a8.108 8.108 0 015.774-2.393c2.182 0 4.232.85 5.775 2.393a8.108 8.108 0 012.392 5.773c0 2.182-.85 4.232-2.392 5.775a8.107 8.107 0 01-5.775 2.392 8.104 8.104 0 01-5.774-2.394z"
          fill="currentColor"
          fill-rule="evenodd"
        />
      </svg>
    </button>
  </div>
</template>

<script>
import { mapState } from 'vuex';

export default {
  name: 'SearchBox',
  data () {
    return {
      filterText: ''
    };
  },
  computed: {
    ...mapState({
      filter: state => state.catalog.filter
    }),
    searchText () {
      return this.filter.searchText;
    }
  },
  methods: {
    clearFilter () {
      this.filterText = '';
      this.updateFilter();
    },
    updateFilter () {
      this.$store.dispatch('catalog/setSearchText', this.filterText);
    }
  },
  watch: {
    searchText: {
      immediate: true,
      handler (newValue) {
        this.filterText = newValue;
      }
    }
  }
};
</script>

<style lang="scss" scoped>
@import 'new-dashboard/styles/variables';

.search-box {
  display: flex;
  flex-direction: row;
  align-items: center;
  overflow: hidden;
  height: 48px;
  padding: 1px;
  border: 1px solid $neutral--600;
  border-radius: 8px;

  input[type='text'] {
    flex: 1 1 auto;
    padding: 10px 16px;
    border: 0;
    color: $navy-blue;

    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;

    &:focus {
      border: 0;
      margin: 0;
      outline: none;
      @media (max-width: $layout-tablet) {
        &::placeholder {
          color: transparent;
        }
      }
    }

    &::placeholder {
      opacity: 1;
      color: $neutral--600;
    }
  }

  &:focus-within,
  &.active-search {
    padding: 0;
    border: 2px solid $color-primary;
  }
}

.search-button {
  padding: 12px 24px;
  color: $neutral--600;
  cursor: pointer;

  &.filled-button {
    background-color: $color-primary;
    color: $white;
  }
}

.clear-search {
  padding: 12px 16px 12px 12px;
  cursor: pointer;
}
</style>
