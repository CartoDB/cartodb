<template>
  <modal :name="name" width="100%" height="100%" :clickToClose="canCloseWithClickOrEsc" @closed="close">
    <button
      v-if="canCloseWithClickOrEsc"
      class="modal__button modal__button--close"
      aria-label="Close"
      @click="close">
    </button>

    <slot />
  </modal>
</template>

<script>
import VModal from 'vue-js-modal';

export default {
  name: 'Wizard',
  components: {
    VModal
  },
  mounted () {
    this.setup();
  },
  beforeDestroy () {
    this.close();
  },
  props: {
    name: {
      type: String,
      default: 'modal'
    },
    canCloseWithClickOrEsc: {
      type: Boolean,
      default: true
    },
    isOpen: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    setup () {
      if (this.isOpen) {
        this.open();
      } else {
        this.close();
      }
    },
    open () {
      this.$modal.show(this.name);
      document.body.classList.add('u-overflow-hidden');
    },
    close () {
      document.body.classList.remove('u-overflow-hidden');
      this.$modal.hide(this.name);
      this.$emit('closeModal');
    }
  },
  watch: {
    isOpen () {
      this.setup();
    }
  }
};
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
