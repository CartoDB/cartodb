<template>
  <div class="features-dropdown">
    <slot />
    <div class="dropdown-container">
      <ul class="list">
        <li class="element" v-for="element in list" :key="element.name || element">
          <a :href="element.url" class="list-text text is-small" v-if="element.url">{{ element.name }}</a>

          <router-link :to="{ name: linkRoute, params: routeParams(element) }" class="list-text text is-small" v-if="!element.url">
            {{ element }}
          </router-link>
        </li>

        <li class="element" v-if="$slots.footer" @click.stop.prevent="noop">
          <span class="list-text text is-small footer">
            <slot name="footer" />
          </span>
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
    },
    noop () {}
  }
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

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
  padding: 10px 22px;
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
  border: 1px solid $border-color;
  border-radius: 4px;
  background-color: $white;
}

.element {
  &:not(:last-of-type) {
    border-bottom: 1px solid $softblue;
  }

  &:first-of-type {
    &::before {
      content: '';
      position: absolute;
      top: -8px;
      left: 24px;
      width: 14px;
      height: 14px;
      transform: rotate(45deg);
      border: 1px solid $border-color;
      border-right: none;
      border-bottom: none;
      border-radius: 2px;
      background-color: $white;
    }
  }
}

.footer {
  color: $text__color;
  cursor: default;
}
</style>
