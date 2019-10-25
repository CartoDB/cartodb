<template>
  <div
    v-click-outside="closeDropdown"
    class="catalogDropdown"
    @keydown.down.prevent="onKeydownDown"
    @keydown.up.prevent="onKeydownUp"
    :class="{'is-disabled': isDisabled, 'is-open': isOpen}">
    <span class="title is-caption catalogDropdown__label">{{ title }}</span>
    <div class="catalogDropdown__container">
      <div v-if="showInput">
        <input type="text"
          class="text is-caption catalogDropdown__input"
          :class="{ 'has-error': hasError }"
          :placeholder="[isOpen ?  $t('CatalogDropdown.placeholder') : placeholder]"
          v-model="searchFilter"
          @focus="onInputFocus"
          @click="openDropdown"
          @keyup.enter="onKeyEnter"
          :disabled="isDisabled || hasError">
      </div>
      <div v-else
        class="text is-caption catalogDropdown__input"
        :class="{ 'has-error': hasError }"
        @click="openDropdown">
        <CatalogDropdownItem :option="searchFilter"/>
        <button class="catalogDropdown__close" @click="reset"><img src="../../assets/icons/common/dropdown-close.svg" width="16" height="20" /></button>
      </div>
      <p class="catalogDropdown__error text is-small" v-if="hasError">{{ error }}</p>
      <ul class="catalogDropdown__list"
        :class="{'is-open': isOpen, 'is-height-limited': limitHeight}"
        @mouseleave="resetActiveOption">
        <li
          v-for="(option, index) in filteredOptions" :key="option"
          @click="selectOption(option)"
          class="catalogDropdown__option text is-caption"
          :class="{'catalogDropdown__option--active': activeOptionIndex === index + 1}"
          @mouseover="updateActiveOption(index + 1)">
          <CatalogDropdownItem :option="option"/>
        </li>
      </ul>
      <div class="catalogDropdown__extra">
        <slot name="extra"></slot>
      </div>
    </div>
  </div>
</template>

<script>
import CatalogDropdownItem from './CatalogDropdownItem';

export default {
  name: 'CatalogDropdown',
  components: {
    CatalogDropdownItem
  },
  props: {
    title: String,
    placeholder: String,
    options: {
      type: Array,
      default () {
        return [];
      }
    },
    open: {
      type: Boolean,
      default: false
    },
    disabled: {
      type: Boolean,
      default: false
    },
    limitHeight: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      selected: {},
      isInputFocused: false,
      activeOptionIndex: -1,
      searchFilter: '',
      isOpen: this.open,
      isDisabled: this.disabled,
      error: ''
    };
  },
  computed: {
    filteredOptions () {
      const filtered = [];
      const regOption = new RegExp(this.searchFilter, 'ig');
      for (const option of this.options) {
        if (this.searchFilter.length < 1 || option.match(regOption)) {
          filtered.push(option);
        }
      }
      return filtered.length > 0 ? filtered : this.options;
    },
    hasError () {
      return this.error.length > 0;
    },
    showInput () {
      return Object.keys(this.selected).length === 0;
    }
  },
  methods: {
    openDropdown () {
      this.isOpen = true;
    },
    closeDropdown () {
      this.isOpen = false;
    },
    disableDropdown () {
      this.isDisabled = true;
    },
    enableDropdown () {
      this.isDisabled = false;
    },
    onInputFocus () {
      this.isInputFocused = true;
    },
    onKeydownDown () {
      if (this.activeOptionIndex < this.options.length) {
        this.activeOptionIndex++;
      }
    },
    onKeydownUp () {
      if (this.activeOptionIndex > 0) {
        this.activeOptionIndex--;
      }
    },
    onKeyEnter () {
      const optionSelected = this.$el.querySelector('.catalogDropdown__option--active');
      if (optionSelected) {
        optionSelected.click();
      }
    },
    updateActiveOption (index) {
      this.activeOptionIndex = index;
    },
    resetActiveOption () {
      this.activeOptionIndex = -1;
    },
    selectOption (option) {
      this.setInput(option);
      this.$emit('selected', this.selected);
    },
    setInput (option) {
      this.enableDropdown();
      this.selected = option;
      this.searchFilter = this.selected;
      this.closeDropdown();
    },
    clearInput () {
      this.searchFilter = '';
      this.selected = {};
      this.closeDropdown();
    },
    reset () {
      this.clearInput();
      this.error = '';
      this.$emit('reset');
      this.openDropdown();
    },
    setError (error) {
      this.error = error;
    }
  },
  watch: {
    disabled () {
      this.isDisabled = this.disabled;
    },
    open () {
      this.isOpen = this.open;
    }
  }
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.catalogDropdown {
  display: flex;
  position: absolute;
  z-index: 2;
  flex-direction: column;
  width: 100%;

  &__label {
    margin-bottom: 16px;
  }

  &__container {
    position: absolute;
    top: 48px;
    width: calc(100% - 20px);
  }

  &__input {
    width: 100%;
    height: 56px;
    padding: 16px 24px;
    border: 1px solid $neutral--300;
    border-radius: 4px;

    &:hover {
      cursor: pointer;

      .catalogDropdown__close {
        display: block;
      }
    }

    &.has-error {
      border: 1px solid $warning__border-color;
    }
  }

  &__error {
    position: relative;
    margin-top: 4px;
    padding-left: 24px;
    font-size: 12px;
    line-height: 16px;

    &::before {
      content: '';
      display: block;
      position: absolute;
      top: -2px;
      left: 0;
      width: 18px;
      height: 18px;
      background-image: url(../../assets/icons/common/warning-icon.svg);
      background-repeat: no-repeat;
      background-position: center;
      background-size: 18px;
    }
  }

  &__close {
    display: none;
    position: absolute;
    top: 18px;
    right: 24px;
  }

  &.is-disabled {
    opacity: 0.24;

    .catalogDropdown__close {
      display: none;
    }
  }

  &.is-open {
    .catalogDropdown__input {
      border-bottom-right-radius: 0;
      border-bottom-left-radius: 0;
      border-top-color: transparent;
      border-right-color: transparent;
      border-left-color: transparent;
    }

    .catalogDropdown__list {
      border: transparent;
    }

    .catalogDropdown__container {
      border-radius: 4px;
      box-shadow: 0 0 0 2px $primary-color;
    }

    .catalogDropdown__extra {
      visibility: visible;
      opacity: 1;
      pointer-events: auto;
    }
  }

  &:not(.is-open) {
    .catalogDropdown__input:hover {
      border-color: $text__color;
    }
  }
}

.catalogDropdown__list {
  visibility: hidden;
  border: 1px solid $softblue;
  opacity: 0;
  background-color: $white;
  pointer-events: none;

  &.is-open {
    visibility: visible;
    opacity: 1;
    pointer-events: auto;
  }

  &.is-height-limited {
    max-height: 196px;
    overflow-y: scroll;
  }
}

.catalogDropdown__option {
  display: block;
  position: relative;
  width: 100%;
  padding: 12px 16px 12px 24px;
  overflow: hidden;
  color: $primary-color;
  text-decoration: none;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;

  &:not(:last-child) {
    border-bottom: 1px solid $softblue;
  }

  &--active {
    background-color: rgba($primary-color, 0.05);
    text-decoration: underline;
  }
}

.catalogDropdown__extra {
  visibility: hidden;
  padding: 16px 24px;
  border-top: 1px solid $softblue;
  border-bottom-right-radius: 4px;
  border-bottom-left-radius: 4px;
  opacity: 0;
  background-color: $white;
  pointer-events: none;

  &--text {
    color: $neutral--600;
  }
}
</style>
