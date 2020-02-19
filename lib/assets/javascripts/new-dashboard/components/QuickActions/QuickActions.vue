<template>
  <div class="quick-actions" v-click-outside="closeDropdown">
    <a href="javascript:void(0)" class="quick-actions-select" @click="toggleDropdown" :class="{'is-active': isOpen }">
      <img svg-inline src="new-dashboard/assets/icons/common/options.svg">
    </a>
    <div class="quick-actions-dropdown" :class="{'is-active' : isOpen}" v-if="isOpen" @click="killEvent">
      <h6 class="quick-actions-title text is-semibold is-xsmall is-txtSoftGrey">{{ $t(`QuickActions.title`) }}</h6>
      <ul>
        <template v-for="action in actions">
          <li class="action__item" :key="action.name" v-if="!action.shouldBeHidden">
            <a href="#" class="action__text text is-caption" :class="{'is-txtPrimary': !action.isDestructive, 'is-txtAlert': action.isDestructive, 'u-is-disabled': action.shouldBeDisabled}" @click="emitEvent(action.event)">{{action.name}}</a>
          </li>
        </template>
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
    emitEvent (action) {
      this.$emit(action);
    },
    toggleDropdown () {
      this.isOpen = !this.isOpen;
      if (this.isOpen) {
        this.$emit('open');
      } else {
        this.$emit('close');
      }
    },
    closeDropdown () {
      this.isOpen = false;
      this.$emit('close');
    },
    killEvent (event) {
      event.preventDefault();
    }
  }
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.quick-actions-select {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: 1px solid transparent;
  border-radius: 2px;
  background: $white;

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
  z-index: $z-index__local-dropdown;
  right: 0;
  width: 260px;
  margin-top: 8px;
  border: 1px solid $border-color--dark;
  border-radius: 2px;
  background-color: $white;
  cursor: default;
}

.quick-actions-title {
  margin-top: 20px;
  margin-bottom: 12px;
  margin-left: 24px;
  text-transform: uppercase;
}

.action {
  &__item {
    &:not(:last-of-type) {
      border-bottom: 1px solid $softblue;
    }
  }

  &__text {
    display: block;
    padding: 12px 24px;

    &:hover,
    &:focus {
      background-color: $softblue;
    }

    &.u-is-disabled {
      pointer-events: none;
      color: grey;
    }
  }
}
</style>
