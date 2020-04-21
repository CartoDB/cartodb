<template>
  <button
    class="button"
    :class="`button--${currentState}`"
    @click="onClick">
    <slot v-if="currentState === 'active'">
      <img class="icon icon--download" svg-inline src="new-dashboard/assets/icons/common/arrow-down.svg" />
    </slot>
    <img class="icon icon--loading" svg-inline src="new-dashboard/assets/icons/common/loading.svg" v-if="currentState === 'waiting'" />
    <img class="icon icon--check" svg-inline src="new-dashboard/assets/icons/common/check.svg" v-if="currentState === 'ready'" />

    <div class="text">{{ buttonText }}</div>
  </button>
</template>

<script>
export default {
  name: 'ActionButton',
  data () {
    return {
      currentState: this.$props.state || 'active'
    };
  },
  props: {
    state: {
      type: String,
      default: 'active'
    },
    activeText: {
      type: String,
      default: 'Click me!'
    },
    waitingText: {
      type: String,
      default: 'Waiting...'
    },
    readyText: {
      type: String,
      default: 'Ready!'
    },
    action: {
      type: Function,
      default: () => Promise.resolve()
    }
  },
  computed: {
    buttonText () {
      const currentState = this.currentState;
      const buttonText = this.$props[`${currentState}Text`];

      return buttonText || this.$props.actionText;
    }
  },
  methods: {
    onClick () {
      if (this.currentState === 'ready') {
        this.$emit('ready');
        return;
      }

      this.currentState = 'waiting';

      return this.$props.action()
        .then(() => {
          this.currentState = 'ready';
          this.$emit('ready');
        })
        .catch(() => {
          this.currentState = 'active';
        });
    }
  },
  watch: {
    state (newState) {
      this.currentState = newState;
    }
  }
};
</script>

<style lang="scss" scoped>
@import 'new-dashboard/styles/variables';

.button {
  transition: all 200ms ease-in-out;
}

.button--waiting {
  opacity: 0.4;
  pointer-events: none;
}

.button--ready {
  background-color: $green--800;
}

.icon {
  margin-right: 16px;
  width: 14px;

  &.icon--download,
  &.icon--loading {
    stroke: $white;
  }

  &.icon--check {
    fill: $white;
  }
}
</style>
