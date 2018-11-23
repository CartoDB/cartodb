<template>
  <form class="navbar-search" :class="{'is-search-open': isSearchOpen}" autocomplete="off">
    <input type="text"
           v-model="searchTerm"
           class="title is-small is-regular navbar-searchInput"
           :class="{ 'navbar-searchInput--filled': Boolean(searchTerm) }"
           :placeholder="placeholder"
           @focus="onInputFocus"
           @blur="onInputBlur">
    <SearchSuggestions :query="searchTerm" :isOpen="isInputFocused"/>
  </form>
</template>

<script>
import SearchSuggestions from './Suggestions/SearchSuggestions';

export default {
  name: 'Search',
  components: {
    SearchSuggestions
  },
  data () {
    return {
      searchTerm: '',
      isInputFocused: false
    };
  },
  props: {
    isSearchOpen: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    placeholder () {
      if (this.isInputFocused) {
        // return this.$t('');
        return 'By tag, name, or description';
      }

      // return this.$t('');
      return 'Search';
    }
  },
  methods: {
    onInputFocus () {
      this.isInputFocused = true;
    },

    onInputBlur () {
      this.isInputFocused = false;
    }
  }
};
</script>

<style lang="scss" scoped>
@import 'stylesheets/new-dashboard/variables';

.navbar-search {
  @media (max-width: $layout-mobile) {
    visibility: hidden;
    opacity: 0;
  }

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 16px;
    width: 18px;
    height: 18px;
    transform: translate3d(0, -50%, 0);
    background-image: url("../../assets/icons/navbar/loupe.svg");
    background-repeat: no-repeat;
    background-position: center;
  }

  &:hover {
    &::after {
      background-image: url("../../assets/icons/navbar/loupe_primary.svg");
    }

    .navbar-searchInput {
      &::placeholder {
        color: $primary-color;
      }

      &:focus {
        &::placeholder {
          color: $text-secondary-color;
        }
      }
    }
  }

  &:focus-within {
    &::after {
      background-image: url("../../assets/icons/navbar/loupe.svg");
    }
  }
}

.navbar-searchInput {
  width: 120px;
  height: 36px;
  padding-left: 42px;
  transition: width 0.3s cubic-bezier(0.4, 0.01, 0.165, 0.99);
  border: 0;
  border-radius: 18px;
  background-color: #FFF;

  &::placeholder {
    color: $text-secondary-color;
  }

  &:focus,
  &.navbar-searchInput--filled {
    width: 240px;
    outline: none;
  }
}

.navbar.is-search-open {
  .navbar-search {
    visibility: visible;
    position: absolute;
    left: 0;
    width: calc(100% - 66px);
    margin-left: 16px;
    opacity: 1;

    &::after {
      display: none;
    }
  }

  .navbar-searchInput {
    width: 100%;
    padding: 16px;
    border-radius: 3px;
    background-image: none;
  }
}
</style>
