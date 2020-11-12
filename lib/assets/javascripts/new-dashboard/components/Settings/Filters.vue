<template>
<div class="filters">
  <h6 class="filters-title text is-xsmall is-txtSoftGrey u-tupper letter-spacing">{{ $t('SettingsDropdown.filter') }}</h6>
  <ul class="list">
    <li class="type text is-caption is-txtGrey" :class="{ 'type--selected': isFilterApplied('mine') }">
      <a href="javascript:void(0)" class="element" :class="{ 'element--selected': isFilterApplied('mine') }" @click="setFilter('mine')">
        {{ $t(`SettingsDropdown.types.${section}`) }}
      </a>
    </li>
    <li v-if="isDatasetSection" class="type text is-caption is-txtGrey" :class="{ 'type--selected': isFilterApplied('subscribed') }">
      <a href="javascript:void(0)" class="element" :class="{ 'element--selected': isFilterApplied('subscribed') }" @click="setFilter('subscribed')">
        {{ $t('SettingsDropdown.types.subscribed', { count: metadata.total_subscriptions }) }}
      </a>
    </li>
    <li v-if="isDatasetSection" class="type text is-caption is-txtGrey" :class="{ 'type--selected': isFilterApplied('sample') }">
      <a href="javascript:void(0)" class="element" :class="{ 'element--selected': isFilterApplied('sample') }" @click="setFilter('sample')">
        {{ $t('SettingsDropdown.types.sample', { count: metadata.total_samples }) }}
      </a>
    </li>
    <li class="type text is-caption is-txtGrey" :class="{ 'type--selected': isFilterApplied('favorited') }">
      <a href="javascript:void(0)" class="element" :class="{ 'element--selected': isFilterApplied('favorited') }" @click="setFilter('favorited')">
        {{ $t('SettingsDropdown.types.favorited', { count: metadata.total_likes }) }}
      </a>
    </li>
    <li class="type text is-caption is-txtGrey" :class="{ 'type--selected': isFilterApplied('shared') }" v-if="metadata.total_shared">
      <a href="javascript:void(0)" class="element" :class="{ 'element--selected': isFilterApplied('shared') }" @click="setFilter('shared')">
        {{ $t('SettingsDropdown.types.shared', { count: metadata.total_shared }) }}
      </a>
    </li>
    <li class="type text is-caption is-txtGrey" :class="{ 'type--selected': isFilterApplied('locked') }">
      <a href="javascript:void(0)" class="element" :class="{ 'element--selected': isFilterApplied('locked') }" @click="setFilter('locked')">
        {{ $t('SettingsDropdown.types.locked', { count: metadata.total_locked }) }}
      </a>
    </li>
    <li class="type text is-caption is-txtGrey" :class="{ 'type--selected': isPrivacyFilterApplied }">
      <div class="element">
        <a href="javascript:void(0)" class="element--inline" :class="{ 'element--selected': isFilterApplied('public') }" @click="setFilter('public')">
          {{ $t('SettingsDropdown.types.publicPrivacy') }}
        </a> |
        <a href="javascript:void(0)" class="element--inline" :class="{ 'element--selected': isFilterApplied('private') }" @click="setFilter('private')">
          {{ $t('SettingsDropdown.types.privatePrivacy') }}
        </a> |
        <a href="javascript:void(0)" class="element--inline" :class="{ 'element--selected': isFilterApplied('link') }" @click="setFilter('link')">
          {{ $t('SettingsDropdown.types.linkPrivacy') }}
        </a> |
        <a href="javascript:void(0)" class="element--inline" :class="{ 'element--selected': isFilterApplied('password') }" @click="setFilter('password')">
          {{ $t('SettingsDropdown.types.passwordPrivacy') }}
        </a>
      </div>
    </li>
    <li v-if="isMapsSection" class="type text is-caption is-txtGrey" :class="{ 'type--selected': isTypeFilterApplied }">
      <div class="element">
        <a href="javascript:void(0)" class="element--inline" :class="{ 'element--selected': isFilterApplied('builder') }" @click="setFilter('builder')">
          {{ $t('SettingsDropdown.types.builderType') }}
        </a> |
        <a href="javascript:void(0)" class="element--inline" :class="{ 'element--selected': isFilterApplied('cartoframes') }" @click="setFilter('cartoframes')">
          {{ $t('SettingsDropdown.types.kuvizType') }}
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
      return ['public', 'private', 'link', 'password'].indexOf(this.$props.filter) > -1;
    },
    isTypeFilterApplied () {
      return ['builder', 'cartoframes'].indexOf(this.$props.filter) > -1;
    },
    isMapsSection () {
      return this.section === 'maps';
    },
    isDatasetSection () {
      return this.section === 'datasets';
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
