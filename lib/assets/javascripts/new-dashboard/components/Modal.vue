<template>
  <div>
    <button class="button button--outline" @click="open()">{{ this.buttonText }}</button>
    <modal name="wizard" :adaptive="true" width="100%" height="100%">
      <button class="modal__button modal__button--close" @click="close()" aria-label="Close"></button>
      <slot />
    </modal>
  </div>
</template>

<script>
import VModal from 'vue-js-modal';

export default {
  name: 'Wizard',
  components: {
    VModal
  },
  props: {
    name: {
      type: String,
      default: 'modal'
    },
    buttonText: {
      type: String,
      default: 'Open modal'
    }
  },
  methods: {
    open () {
      this.$modal.show(this.name);
    },
    close () {
      this.$modal.hide(this.name);
    }
  }
}
</script>
<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.modal {
  &__button {
    position: fixed;
    z-index: 1;
    top: 0;
    padding: 2em;

    &--close {
      right: 0;
      background-image: url('../assets/icons/common/close.svg');
      background-repeat: no-repeat;
      background-position: center;
      background-size: 16px;
    }
  }
}
</style>