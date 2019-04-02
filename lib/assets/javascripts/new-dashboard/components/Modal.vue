<template>
  <div>
    <modal :name="name" :adaptive="true" width="100%" height="100%" :scrollable="true">
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
    isOpen: {
      type: Boolean,
      default: false
    }
  },
  methods: {
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
      if (this.isOpen) {
        this.open();
      } else {
        this.close();
      }
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
