<template>
  <div class="features-dropdown">
    <slot />
    <div class="dropdown-container">
      <ul class="list">
        <li class="element" v-for="elem in list" :key="elem">
          <router-link :to="{ name: linkRoute, params: routeParams(elem) }" class="list-text text is-small">
            {{ elem }}
          </router-link>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>

export default {
  name: 'FeaturesDropdown',
  props: {
    list: Array,
    feature: String,
    linkRoute: String
  },
  methods: {
    routeParams (element) {
      return { [this.feature]: element };
    }
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

.list-text {
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

.list {
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

.element {
  &:first-of-type {
    padding-top: 8px;
  }

  &:last-of-type {
    padding-bottom: 8px;
  }
}
</style>
