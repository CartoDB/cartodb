<template>
<div class="section">
  <h6 class="text is-xsmall is-txtSoftGrey u-tupper letter-spacing">{{ $t('SettingsDropdown.showMe') }}</h6>
  <ul class="list">
    <li class="type text is-caption is-txtGrey" :class="{ 'type--selected': isFilterApplied('mine') }">
      <a href="javascript:void(0)" class="element" :class="{ 'element--selected': isFilterApplied('mine') }" @click="setFilter('mine')">
        {{ $t(`SettingsDropdown.types.${section}`) }}
      </a>
    </li>
    <li class="type text is-caption is-txtGrey" :class="{ 'type--selected': isFilterApplied('shared') }" v-if="metadata.total_shared">
      <a href="javascript:void(0)" class="element" :class="{ 'element--selected': isFilterApplied('shared') }" @click="setFilter('shared')">
        {{ $t('SettingsDropdown.types.shared', { count: metadata.total_shared }) }}
      </a>
    </li>
    <li class="type text is-caption is-txtGrey" :class="{ 'type--selected': isFilterApplied('favorited') }" v-if="metadata.total_likes">
      <a href="javascript:void(0)" class="element" :class="{ 'element--selected': isFilterApplied('favorited') }" @click="setFilter('favorited')">
        {{ $t('SettingsDropdown.types.favorited', { count: metadata.total_likes }) }}
      </a>
    </li>
    <li class="type text is-caption is-txtGrey" :class="{ 'type--selected': isFilterApplied('locked') }" v-if="metadata.total_locked">
      <a href="javascript:void(0)" class="element" :class="{ 'element--selected': isFilterApplied('locked') }" @click="setFilter('locked')">
        {{ $t('SettingsDropdown.types.locked', { count: metadata.total_locked }) }}
      </a>
    </li>
    <li class="type text is-caption is-txtGrey" :class="{ 'type--selected': isPrivacyFilterApplied }">
      <a href="javascript:void(0)" class="element" :class="{ 'element--selected': isFilterApplied('public') }" @click="setFilter('public')">
        {{ $t('SettingsDropdown.types.publicPrivacy') }}
      </a> |
      <a href="javascript:void(0)" class="element" :class="{ 'element--selected': isFilterApplied('private') }" @click="setFilter('private')">
        {{ $t('SettingsDropdown.types.privatePrivacy') }}
      </a> |
      <a href="javascript:void(0)" class="element" :class="{ 'element--selected': isFilterApplied('link') }" @click="setFilter('link')">
        {{ $t('SettingsDropdown.types.linkPrivacy') }}
      </a> |
      <a href="javascript:void(0)" class="element" :class="{ 'element--selected': isFilterApplied('password') }" @click="setFilter('password')">
        {{ $t('SettingsDropdown.types.passwordPrivacy') }}
      </a>
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
@import 'stylesheets/new-dashboard/variables';

.section {
  padding: 24px 12px 24px 36px;
  border-bottom: 1px solid $light-grey;
  background-color: #FFF;
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
      background-image: url("../../assets/icons/common/check.svg");
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
</style>
