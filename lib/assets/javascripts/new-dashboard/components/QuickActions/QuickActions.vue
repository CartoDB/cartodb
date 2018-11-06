<template>
  <div class="quick-actions">
    <a href="#" class="quick-actions-select" @click.prevent="toggleDropdown" :class="{'is-active' : isOpen}">
      <img svg-inline src="new-dashboard/assets/icons/common/options.svg">
    </a>
    <div class="quick-actions-dropdown" :class="{'is-active' : isOpen}" v-if="isOpen" v-click-outside="closeDropdown" @click.prevent="">
      <h6 class="quick-actions-title text is-semibold is-xsmall is-txtSoftGrey">Quick actions</h6>
      <ul>
        <li v-for="action in actions" :key="action.name">
          <a href="#" class="action text is-caption" :class="{'is-txtPrimary': !action.isDestructive, 'is-txtAlert': action.isDestructive}" @click="doAction(action.event)">{{action.name}}</a>
        </li>
      </ul>
    </div>
  </div>
</template>

<script>

export default {
  name: 'QuickActions',
  data: function () {
    return {
      isOpen: false
    };
  },
  props: {
    actions: Array
  },
  methods: {
    doAction (action) {
      this.$emit(action);
    },
    toggleDropdown () {
      this.isOpen = !this.isOpen;
      if (this.isOpen) {
        this.$emit('openQuickactions');
      } else {
        this.$emit('closeQuickactions');
      }
    },
    closeDropdown () {
      this.isOpen = false;
      this.$emit('closeQuickactions');
    }
  }
};
</script>

<style scoped lang="scss">
@import 'stylesheets/new-dashboard/variables';

.quick-actions-select {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  background: $white;
  box-shadow: 1px 1px 1px rgba(0, 0, 0, 0.12);

  &.is-active {
    background-color: $primary-color;

    .path {
      fill: $white;
    }
  }

  &:hover {
    border: 1px solid $primary-color;
  }
}

.quick-actions-dropdown {
  position: absolute;
  z-index: 1;
  right: 0;
  width: 260px;
  margin-top: 8px;
  border: 1px solid $grey;
  border-radius: 2px;
  background-color: $white;
  cursor: default;
}

.quick-actions-title {
  margin-top: 16px;
  margin-left: 24px;
  text-transform: uppercase;
}

.action {
  display: block;
  padding: 14.5px 24px 15.5px;
  border-bottom: 1px solid $softblue;
}
</style>
