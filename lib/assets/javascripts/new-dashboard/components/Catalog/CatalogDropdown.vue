<template>
  <div 
    class="catalogDropdown"
    @keydown.down.prevent="onKeydownDown"
    @keydown.up.prevent="onKeydownUp"
    :class="{'is-disabled': isDisabled, 'is-open': isOpen}">
    <span class="title is-caption catalogDropdown__label">{{ title }}</span>
    <div class="catalogDropdown__container">
      <input type="text"
        ref="catalogDropdownInput"
        class="text is-caption catalogDropdown__input"
        :placeholder="placeholder"
        v-model="searchFilter"
        @focus="onInputFocus"
        @click="openDropdown"
        @keyup.enter="onKeyEnter"
        :disabled="isDisabled">
        <button v-if="searchFilter" class="catalogDropdown__close" @click="resetInput"><img src="../../assets/icons/common/dropdown-close.svg" width="16" height="20" /></button>
      <ul class="catalogDropdown__list" 
        :class="{'is-open': isOpen, 'is-height-limited': limitHeight}"
        @mouseleave="resetActiveOption">
        <li
          v-for="(option, index) in filteredOptions" :key="option"  
          @click="selectOption(option)"
          class="catalogDropdown__option text is-caption"
          :class="{'catalogDropdown__option--active': activeOptionIndex === index + 1}"
          @mouseover="updateActiveOption(index + 1)">
          {{ option }}
        </li>
      </ul>
      <div class="catalogDropdown__extra"><span class="catalogDropdown__extra--text text is-small">Your country is not listed <a href="">Contact Us</a></span></div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CatalogDropdown',
  props: {
    title: String,
    placeholder: String,
    options: {
      type: Array,
      default: []
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
      isDisabled: this.disabled
    }
  },
  computed: {
    filteredOptions() {
      const filtered = [];
      const regOption = new RegExp(this.searchFilter, 'ig');
      for (const option of this.options) {
        if (this.searchFilter.length < 1 || option.match(regOption)){
          filtered.push(option);
        }
      }
      return filtered.length > 0 ? filtered : this.options ;
    }
  },
  methods: {
    openDropdown () {
      this.isOpen = true;
    },
    closeDropdown () {
      this.isOpen = false;
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
      this.selected = option;
      this.isOpen = false;
      this.searchFilter = this.selected;
      this.$emit('selected', this.selected);
    },
    resetInput () {
      this.searchFilter = '';
      this.selected = {};
      this.$refs.catalogDropdownInput.value = '';
      this.$emit('reset');
    }
  },
  watch: {
    disabled() {
      this.isDisabled = this.disabled;
    },
    open() {
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
    width: 100%;
  }

  &__input {
    width: 100%;
    height: 56px;
    padding: 16px 24px;
    border: 1px solid $neutral--300;
    border-radius: 4px;
  }

  &__close {
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
      border-top: transparent;
      border-right: transparent;
      border-left: transparent;
      border-bottom-right-radius: 0;
      border-bottom-left-radius: 0;
    }

    .catalogDropdown__list {
      border: transparent;
    }

    .catalogDropdown__container {
      border: 2px solid $primary-color;
      border-radius: 4px;
    }

    .catalogDropdown__extra {
      visibility: visible;
      opacity: 1;
      pointer-events: auto;
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
  padding: 12px 16px 12px 36px;
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
  opacity: 0;
  background-color: $white;
  pointer-events: none;

  &--text {
    color: $neutral--600;
  }
}
</style>
