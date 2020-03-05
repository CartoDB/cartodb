<template>
<div class="filters">
  <h6 class="filters-title text is-xsmall is-txtSoftGrey u-tupper letter-spacing">{{ $t('SettingsDropdown.filter') }}</h6>
  <ul class="list">
    <li class="type text is-caption is-txtGrey" :class="{ 'type--selected': isFilterApplied('mine') }">
      <a href="javascript:void(0)" class="element" :class="{ 'element--selected': isFilterApplied('mine') }" @click="setFilter('mine')">
        {{ $t(`SettingsDropdown.types.${section}`) }}
      </a>
    </li>
    <li class="type text is-caption is-txtGrey" :class="{ 'type--selected': isPrivacyFilterApplied }">
      <div class="element">
        <a href="javascript:void(0)" class="element--inline" :class="{ 'element--selected': isFilterApplied('private') }" @click="setFilter('private')">
          {{ $t('SettingsDropdown.types.privatePrivacy') }}
        </a> |
        <a href="javascript:void(0)" class="element--inline" :class="{ 'element--selected': isFilterApplied('link') }" @click="setFilter('link')">
          {{ $t('SettingsDropdown.types.linkPrivacy') }}
        </a>
      </div>
    </li>
  </ul>
</div>
</template>

<script>
export default {
  name: 'Filters',
  props: {
    section: String,
    filter: String,
    metadata: {
      type: Object,
      default () {
        return { total_shared: 0 };
      }
    }
  },
  computed: {
    isPrivacyFilterApplied () {
      return ['private', 'link'].indexOf(this.$props.filter) > -1;
    },
    isMapsSection () {
      return this.section === 'maps';
    }
  },
  methods: {
    setFilter (filter) {
      this.$emit('filterChanged', filter);
    },

    isFilterApplied (filter) {
      return this.$props.filter === filter;
    }
  }
};
</script>

<style lang="scss" scoped>
@import 'new-dashboard/styles/variables';

.filters {
  background-color: $white;

  &-title {
    padding: 20px 24px 12px 36px;
  }
}

.type {
  &:not(:last-child) {
    border-bottom: 1px solid $softblue;
  }

  &.type--selected {
    position: relative;

    &::before {
      content: "";
      position: absolute;
      top: 50%;
      left: 14px;
      width: 14px;
      height: 14px;
      transform: translateY(-50%);
      background-image: url("../../assets/icons/common/check.svg");
      background-repeat: no-repeat;
      background-position: center;
    }
  }
}

.element {
  display: block;
  padding: 12px 24px 12px 36px;

  &--inline {
    display: inline-block;
    padding: 0;
  }

  &:hover,
  &:focus {
    background-color: $softblue;
  }
}

.element,
.element--inline {
  &.element--selected {
    color: $text__color;
    pointer-events: none;
  }
}
</style>
