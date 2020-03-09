<template>
  <section v-click-outside="closeDropdown">
    <button class="dropdown__toggle" :class="{ 'dropdown__toggle--active': isOpen }" @click="toggleDropdown">
      <slot name="button"/>
    </button>

    <div class="dropdown" :class="{ 'is-open': isOpen }">
      <slot />
    </div>
  </section>
</template>

<script>
export default {
  name: 'Dropdown',
  data () {
    return {
      isOpen: false
    };
  },
  methods: {
    toggleDropdown () {
      this.isOpen = !this.isOpen;
    },
    closeDropdown () {
      this.isOpen = false;
    }
  }
};
</script>

<style lang="scss" scoped>
@import 'new-dashboard/styles/variables';

.dropdown {
  visibility: hidden;
  position: absolute;
  z-index: $z-index__dropdown;
  right: 0;
  width: 316px;
  margin-top: 8px;
  overflow: hidden;
  transition: all 0.25s linear;
  border: 1px solid $border-color;
  border-radius: 2px;
  opacity: 0;
  pointer-events: none;

  &.is-open {
    visibility: visible;
    opacity: 1;
    pointer-events: auto;
  }
}

.dropdown__toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  padding: 0 9px;
  border-radius: 2px;

  &:hover {
    background-color: $softblue;
  }

  &.dropdown__toggle--active {
    background-color: $primary-color;

    .svgicon {
      fill: $white;
    }
  }
}
</style>
