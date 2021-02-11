<template>
  <div v-click-outside="close" class="dropdown-wrapper u-mt--12 u--mb--36">
    <div class="u-flex select-wrapper" :class="{'is-active': opened}" @click="open">
      <span @click.stop="open" class="text u-flex u-flex__align--center u-flex__grow--1" :class="{ placeholder: !(value && value.label) }" v-if="!opened">
        {{(value && value.label) || placeholder}}
      </span>
      <input v-show="opened" ref="input" :placeholder="placeholder" v-model="searchingText" class="u-flex__grow--1" autocomplete="off" type="text" name="search">
    </div>
    <transition name="expand" @enter="enter" @after-enter="afterEnter" @leave="leave">
      <div class="item-list-container" v-if="opened">
        <div class="text is-small item" @click="selectItem(item)" v-for="item in filteredElements" :key="item.id">{{item.label}}</div>
        <div class="text is-small item" v-if="(!filteredElements.length && !showCreate) || (showCreate && !searchingText && !filteredElements.length)">
          <slot v-if="hasSlot('noResults')" v-bind:data="{ searchingText, filteredElements }" name="noResults"></slot>
          <span v-else>No results</span>
        </div>
        <div class="text is-small item" v-if="showCreate && searchingText && !hasExactlyMatch">
          <slot v-if="hasSlot('createMessage')" v-bind:data="{ searchingText, filteredElements, createNew }" name="createMessage"></slot>
          <span v-else>Create <a @click="createNew">{{searchingText}}</a> as item</span>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import { normalize } from 'new-dashboard/utils/matchString';

export default {
  name: 'DropdownComponent',
  data () {
    return {
      opened: false,
      searchingText: ''
    };
  },
  model: {
    event: 'optionChange'
  },
  props: {
    placeholder: String,
    elements: Array,
    value: null,
    showCreate: Boolean,
    type: {
      type: String,
      default: 'text'
    }
  },
  methods: {
    async open () {
      this.searchingText = '';
      this.opened = true;
      await this.$nextTick();
      this.$refs.input.focus();
    },
    close () {
      this.opened = false;
    },
    hasSlot (name) {
      return !!this.$slots[name] || !!this.$scopedSlots[name];
    },
    enter (element) {
      element.style.height = 'auto';
      const height = getComputedStyle(element).height;
      element.style.height = 0;
      setTimeout(() => { element.style.height = height; });
    },
    afterEnter (element) {
      element.style.height = 'auto';
    },
    leave (element) {
      const height = getComputedStyle(element).height;
      element.style.height = height;
      setTimeout(() => { element.style.height = 0; });
    },
    selectItem (item) {
      this.$emit('optionChange', item);
      this.close();
    },
    createNew () {
      this.$emit('createElement', this.searchingText);
      this.close();
    }
  },
  computed: {
    hasExactlyMatch () {
      return this.elements.some(e => e.id === this.searchingText);
    },
    filteredElements () {
      const regex = new RegExp(normalize(this.searchingText.toLowerCase()), 'gi');
      return this.elements.filter(match => {
        return normalize(`${match.id}`).match(regex) || normalize(match.label).match(regex);
      });
    }
  },
  watch: {
  }
};
</script>

<style lang="scss" scoped>
@import 'new-dashboard/styles/variables';

.dropdown-wrapper {
  position: relative;
  width: 512px;

  .item-list-container {
    position: absolute;
    top: 44px;
    max-height: 200px;
    width: 100%;
    z-index: 9;
    border: 1px solid $neutral--300;
    border-radius: 2px;
    background: $white;
    overflow: auto;
    cursor: pointer;

    .item {
      padding: 12px 24px 12px 12px;

      &:not(:last-child) {
        border-bottom: 1px solid $neutral--300;
      }

      &:hover {
        background-color: $softblue;
      }
    }
  }

  .expand-enter-active,
  .expand-leave-active {
    transition: height 0.25s ease;
    overflow: hidden;
  }

  .expand-enter,
  .expand-leave-to {
    height: 0;
  }

  .select-wrapper {
    position: relative;
    border: solid 1px #dddddd;
    border-radius: 4px;
    background-color: $white;
    font-size: 12px;
    color: $neutral--800;
    height: 40px;
    padding-left: 12px;
    padding-right: 12px;
    -moz-appearance:none; /* Firefox */
    -webkit-appearance:none; /* Safari and Chrome */
    appearance:none;

    .placeholder {
      color: $neutral--600;
    }

    &.is-active {
      border-color: $color-primary;

      input {
        cursor: text;
      }
    }

    input {
      border: 0;
      outline: none;
      padding: 12px 12px 12px 0;
      cursor: pointer;

      &::placeholder {
        color: rgba(46, 60, 67, 0.48);
      }

      &:-ms-input-placeholder {
        color: rgba(46, 60, 67, 0.48);
      }

      &::-ms-input-placeholder {
        color: rgba(46, 60, 67, 0.48);
      }
    }

    &::after {
      content: '';
      width: 16px;
      height: 100%;
      transition: all 0.25s cubic-bezier(0.4, 0.01, 0.165, 0.99);
      background-image: url('../../assets/icons/datasets/chevron.svg');
      background-repeat: no-repeat;
      background-position: center;
    }
  }
}
</style>
