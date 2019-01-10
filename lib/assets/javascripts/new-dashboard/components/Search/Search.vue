<template>
  <form class="navbar-search" :class="{'is-search-open': isSearchOpen}" autocomplete="off" @submit.stop.prevent="onFormSubmit" @keydown.down.prevent="onKeydownDown" @keydown.up.prevent="onKeydownUp" @keydown.enter.prevent="onKeydownEnter">
    <input type="text"
           v-model.trim="searchTerm"
           ref="searchInput"
           class="title is-small is-regular navbar-searchInput"
           :class="{ 'navbar-searchInput--filled': isFilled }"
           :placeholder="placeholder"
           @focus="onInputFocus"
           @blur="onInputBlur">
    <SearchSuggestions :query="searchTerm" :isOpen="isInputFocused && isFilled" @pageChange="resetInput" ref="searchSuggestions"/>
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
        return this.$t('SearchComponent.placeholder.active');
      }

      return this.$t('SearchComponent.placeholder.default');
    },
    isFilled () {
      return Boolean(this.searchTerm);
    }
  },
  methods: {
    onInputFocus () {
      this.isInputFocused = true;
    },
    onInputBlur () {
      this.isInputFocused = false;
    },
    onFormSubmit () {
      this.blurInput();

      if (this.searchTerm.includes(':')) {
        this.$router.push({ name: 'tagSearch', params: { tag: this.searchTerm.substring(1) } });
      } else if (this.searchTerm) {
        this.$router.push({ name: 'search', params: { query: this.searchTerm } });
      }

      this.searchTerm = '';
    },
    blurInput () {
      this.$refs.searchInput.blur();
    },
    resetInput () {
      this.searchTerm = '';
      this.blurInput();
    },
    onKeydownDown () {
      this.$refs.searchSuggestions.keydownDown();
    },
    onKeydownUp () {
      this.$refs.searchSuggestions.keydownUp();
    },
    onKeydownEnter () {
      const activeSuggestion = this.$refs.searchSuggestions.getActiveSuggestion();
      if (activeSuggestion) {
        activeSuggestion.click();
      } else {
        this.onFormSubmit();
      }
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
  padding: 0 14px 0 42px;
  transition: width 0.3s cubic-bezier(0.4, 0.01, 0.165, 0.99);
  border: 0;
  border-radius: 18px;
  background-color: $white;

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
