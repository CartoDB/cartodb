<template>
<section v-click-outside="closeDropdown">
  <button class="dropdown__toggle" @click="toggleDropdown" :class="{ 'dropdown__toggle--active': isDropdownOpen }">
    <slot />
  </button>

  <div class="dropdown" :class="{ 'is-open': isDropdownOpen }">
    <div class="section">
      <h6 class="text is-xsmall is-txtSoftGrey u-tupper letter-spacing">{{ $t('FilterDropdown.showMe') }}</h6>
      <ul class="list">
        <li class="type text is-caption is-txtGrey" :class="{ 'type--selected': isFilterApplied('mine') }">
          <a href="javascript:void(0)" class="element" :class="{ 'element--selected': isFilterApplied('mine') }" @click="setFilter('mine')">
            {{ $t(`FilterDropdown.types.${section}`, { count: metadata.total_user_entries }) }}
          </a>
        </li>
        <li class="type text is-caption is-txtGrey" :class="{ 'type--selected': isFilterApplied('shared') }" v-if="metadata.total_shared">
          <a href="javascript:void(0)" class="element" :class="{ 'element--selected': isFilterApplied('shared') }" @click="setFilter('shared')">
            {{ $t('FilterDropdown.types.shared', { count: metadata.total_shared }) }}
          </a>
        </li>
        <li class="type text is-caption is-txtGrey" :class="{ 'type--selected': isFilterApplied('favorited') }" v-if="metadata.total_likes">
          <a href="javascript:void(0)" class="element" :class="{ 'element--selected': isFilterApplied('favorited') }" @click="setFilter('favorited')">
            {{ $t('FilterDropdown.types.favorited', { count: metadata.total_likes }) }}
          </a>
        </li>
        <li class="type text is-caption is-txtGrey" :class="{ 'type--selected': isFilterApplied('locked') }">
          <a href="javascript:void(0)" class="element" :class="{ 'element--selected': isFilterApplied('locked') }" @click="setFilter('locked')">
            {{ $t('FilterDropdown.types.locked') }}
          </a>
        </li>
        <li class="type text is-caption is-txtGrey" :class="{ 'type--selected': isPrivacyFilterApplied }">
          <a href="javascript:void(0)" class="element" :class="{ 'element--selected': isFilterApplied('public') }" @click="setFilter('public')">
            {{ $t('FilterDropdown.types.publicPrivacy') }}
          </a> |
          <a href="javascript:void(0)" class="element" :class="{ 'element--selected': isFilterApplied('private') }" @click="setFilter('private')">
            {{ $t('FilterDropdown.types.privatePrivacy') }}
          </a> |
          <a href="javascript:void(0)" class="element" :class="{ 'element--selected': isFilterApplied('link') }" @click="setFilter('link')">
            {{ $t('FilterDropdown.types.linkPrivacy') }}
          </a> |
          <a href="javascript:void(0)" class="element" :class="{ 'element--selected': isFilterApplied('password') }" @click="setFilter('password')">
            {{ $t('FilterDropdown.types.passwordPrivacy') }}
          </a>
        </li>
      </ul>
    </div>
    <div class="section">
      <h6 class="text is-xsmall is-txtSoftGrey u-tupper letter-spacing">{{ $t('FilterDropdown.orderMaps') }}</h6>
      <ul class="list">
        <li class="type text is-caption is-txtGrey" :class="{ 'type--selected': isOrderApplied('updated_at') }">
          {{ $t('FilterDropdown.order.date.title') }}  (
            <a href="javascript:void(0)" class="element" :class="{ 'element--selected': isOrderApplied('updated_at', 'desc') }" @click="setOrder('updated_at', 'desc')">
              {{ $t('FilterDropdown.order.date.newest') }}
            </a> |
            <a href="javascript:void(0)" class="element" :class="{ 'element--selected': isOrderApplied('updated_at', 'asc') }" @click="setOrder('updated_at', 'asc')">
              {{ $t('FilterDropdown.order.date.oldest') }}
            </a>
          )
        </li>
        <li class="type text is-caption is-txtGrey" :class="{ 'type--selected': isOrderApplied('name') }">
          {{ $t('FilterDropdown.order.alphabetical.title') }} (
            <a href="javascript:void(0)" class="element" :class="{ 'element--selected': isOrderApplied('name', 'asc') }" @click="setOrder('name', 'asc')">
              {{ $t('FilterDropdown.order.alphabetical.A-Z') }}
            </a> |
            <a href="javascript:void(0)" class="element" :class="{ 'element--selected': isOrderApplied('name', 'desc') }" @click="setOrder('name', 'desc')">
              {{ $t('FilterDropdown.order.alphabetical.Z-A') }}
            </a>
          )
        </li>
        <li class="type text is-caption is-txtGrey" :class="{ 'type--selected': isOrderApplied('mapviews', 'desc') }">
          <a href="javascript:void(0)" class="element" :class="{ 'element--selected': isOrderApplied('mapviews', 'desc') }" @click="setOrder('mapviews', 'desc')">
            {{ $t('FilterDropdown.order.views') }}
          </a>
        </li>
      </ul>
    </div>
  </div>
</section>
</template>

<script>
export default {
  name: 'MapCard',
  props: {
    section: String,
    filter: String,
    order: String,
    orderDirection: String,
    metadata: {
      type: Object,
      default () {
        return { total_shared: 0 };
      }
    }
  },
  data: function () {
    return {
      isVisible: false,
      isDropdownOpen: false
    };
  },
  computed: {
    isPrivacyFilterApplied () {
      return ['public', 'private', 'link', 'password'].indexOf(this.$props.filter) > -1;
    }
  },
  methods: {
    isOrderApplied (order, direction) {
      return direction
        ? (this.$props.order === order) && (this.$props.orderDirection === direction)
        : this.$props.order === order;
    },
    isFilterApplied (filter) {
      return this.$props.filter === filter;
    },
    toggleDropdown () {
      this.isDropdownOpen = !this.isDropdownOpen;
    },
    closeDropdown () {
      this.isDropdownOpen = false;
    },
    setFilter (filter) {
      this.closeDropdown();
      this.$emit('filterChanged', filter);
    },
    setOrder (order, direction) {
      this.closeDropdown();
      this.$emit('orderChanged', { order, direction });
    }
  }
};
</script>

<style scoped lang="scss">
@import 'stylesheets/new-dashboard/variables';

.dropdown {
  visibility: hidden;
  position: absolute;
  z-index: 2;
  right: 0;
  width: 310px;
  margin-top: 8px;
  overflow: hidden;
  transition: all 0.25s linear;
  border: 1px solid $light-grey;
  border-radius: 2px;
  opacity: 0;
  pointer-events: none;

  &.is-open {
    visibility: visible;
    opacity: 1;
    pointer-events: initial;
  }
}

.section {
  padding: 24px 12px 24px 36px;
  border-bottom: 1px solid $light-grey;
  background-color: #FFF;

  &:last-of-type {
    border-bottom: none;
  }

  &:nth-child(2n) {
    background-color: $softblue;
  }
}

.list {
  margin-top: 8px;
}

.type {
  margin-bottom: 8px;

  &:last-of-type {
    margin-bottom: 0;
  }

  &.type--selected {
    position: relative;

    &::before {
      content: "";
      position: absolute;
      top: 50%;
      left: -22px;
      width: 14px;
      height: 14px;
      transform: translateY(-50%);
      background-image: url("../assets/icons/common/check.svg");
      background-repeat: no-repeat;
      background-position: center;
    }
  }
}

.element {
  text-decoration: none;

  &.element--selected {
    color: $text-color;
    pointer-events: none;
  }
}

.dropdown__toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  padding: 0 9px;
  border-radius: 2px;

  &.dropdown__toggle--active {
    background-color: #F2F6F9;
  }
}
</style>
