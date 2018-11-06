<template>
<section v-click-outside="closeDropdown">
  <button class="dropdown__toggle" @click="toggleDropdown" :class="{ 'dropdown__toggle--active': isDropdownOpen }">
    <svg width="18" height="20" viewBox="0 0 18 20" xmlns="http://www.w3.org/2000/svg">
      <g fill="#036FE2" fill-rule="evenodd">
        <path d="M8.3 6.7l1.4-1.4L5 .58.3 5.29l1.4 1.42L4 4.4v11.6h2V4.4zM16.3 13.3L14 15.58V4h-2V15.6l-2.3-2.3-1.4 1.42 4.7 4.7 4.7-4.7z"/>
      </g>
    </svg>
  </button>

  <div class="dropdown" :class="{ 'is-open': isDropdownOpen }">
    <div class="section">
      <h6 class="text is-xsmall is-txtSoftGrey u-tupper letter-spacing">{{ $t('FilterDropdown.showMe') }}</h6>
      <ul class="list">
        <li class="type text is-caption is-txtGrey" :class="{ 'type--selected': isFilterApplied('mine') }">
          <a href="javascript:void(0)" class="element" :class="{ 'element--selected': isFilterApplied('mine') }" @click="setFilter('mine')">
            {{ $t('FilterDropdown.types.yourMaps', { count: metadata.total_user_entries }) }}
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
        <li class="type text is-caption is-txtGrey" :class="{ 'type--selected': isOrderApplied('favouritesFirst') }">
          <a href="javascript:void(0)" class="element" :class="{ 'element--selected': isOrderApplied('favouritesFirst') }" @click="setOrder('favouritesFirst')">
            {{ $t('FilterDropdown.order.favourites') }}
          </a>
        </li>
        <li class="type text is-caption is-txtGrey">
          {{ $t('FilterDropdown.order.alphabetical.title') }} (
            <a href="javascript:void(0)" class="element" @click="setOrder('alphabetically')">
              {{ $t('FilterDropdown.order.alphabetical.A-Z') }}
            </a> |
            <a href="javascript:void(0)" class="element" @click="setOrder('alphabeticallyReverse')">
              {{ $t('FilterDropdown.order.alphabetical.Z-A') }}
            </a>
          )
        </li>
        <li class="type text is-caption is-txtGrey" :class="{ 'type--selected': isOrderApplied('updated_at') }">
          Date Modified (
            <a href="javascript:void(0)" class="element" :class="{ 'element--selected': isOrderApplied('updated_at') }" @click="setOrder('updated_at')">
              {{ $t('FilterDropdown.order.date.last') }}
            </a> |
            <a href="javascript:void(0)" class="element">
              {{ $t('FilterDropdown.order.date.first') }}
            </a>
          )
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
    filter: String,
    order: String,
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
    isOrderApplied (order) {
      return this.$props.order === order;
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
    setOrder (order) {
      this.closeDropdown();
      this.$emit('orderChanged', order);
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
  width: 36px;
  height: 36px;
  border-radius: 2px;

  &.dropdown__toggle--active {
    background-color: #F2F6F9;
  }
}
</style>
