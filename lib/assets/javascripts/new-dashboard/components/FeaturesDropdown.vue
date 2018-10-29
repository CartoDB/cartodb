<template>
  <div class="features-dropdown">
    <span class="feature-text text is-caption is-txtGrey">{{tags.length}} {{feature}}</span>
    <div class="dropdown-container">
      <ul class="tag-list">
        <li class="tag" v-for="tag in tags" :key="tag">
          <a href="#" class="tag-text text is-small">{{tag}}</a>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>

export default {
  name: 'FeaturesDropdown',
  props: {
    tags: Array,
    feature: String
  }
};
</script>

<style scoped lang="scss">
@import 'stylesheets/new-dashboard/variables';

.features-dropdown {
  &:hover {
    .dropdown-container {
      opacity: 1;
      pointer-events: all;
    }

    .feature-text {
      color: $primary-color;
    }
  }
}

.tag-text {
  display: inline-block;
  width: 100%;
  padding: 8px 22px;
}

.dropdown-container {
  position: absolute;
  z-index: 1;
  min-width: 60%;
  padding-top: 16px;
  transform: translateX(-12px);
  transform: all 0.3s linear;
  opacity: 0;
  pointer-events: none;
}

.tag-list {
  position: relative;
  padding: 0;
  border: 1px solid $light-grey;
  border-radius: 4px;
  background-color: $white;

  &::after {
    content: '';
    position: absolute;
    top: -9px;
    left: 24px;
    width: 16px;
    height: 16px;
    transform: rotate(45deg);
    border: 1px solid $light-grey;
    border-right: none;
    border-bottom: none;
    border-radius: 2px;
    background-color: $white;
  }
}

.tag {
  &:first-of-type {
    padding-top: 8px;
  }

  &:last-of-type {
    padding-bottom: 8px;
  }
}
</style>
