<template>
  <Modal ref="confirmActionDialog" :name="`confirmActionDialog-${modalId}`">
    <div class="confirmActionDialog">
      <div class="confirmActionDialog__content">
        <div class="confirmActionDialog__icon u-mb--24">
          <img class="confirmActionDialog__svg" svg-inline src="new-dashboard/assets/icons/certificates/lock.svg">
          <img class="confirmActionDialog__badge" svg-inline src="new-dashboard/assets/icons/apps/trash.svg">
        </div>

        <p class="text is-caption u-mb--8">
          {{ title }}
        </p>

        <p class="text is-small is-txtSoftGrey">
          {{ description }}
        </p>

        <div class="confirmActionDialog__actions">
          <button class="button button--outline button--uppercase u-mr--12" @click="close">
            {{ cancelText }}
          </button>

          <button class="button button--alert button--uppercase" @click="confirm">
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Modal>
</template>

<script>
import Modal from '../Modal';

export default {
  name: 'ConfirmActionDialog',
  components: { Modal },
  props: {
    modalId: String,
    title: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      default: ''
    },
    cancelText: {
      type: String,
      default: 'Cancel'
    },
    confirmText: {
      type: String,
      default: 'Confirm'
    }
  },
  methods: {
    confirm () {
      this.$emit('confirm');
      this.close();
    },
    open () {
      this.$refs.confirmActionDialog.open();
    },
    close () {
      this.$refs.confirmActionDialog.close();
    }
  }
};
</script>

<style lang="scss" scoped>
@import 'new-dashboard/styles/variables';

.confirmActionDialog {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  width: 100%;
  height: 100%;
}

.confirmActionDialog__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: $modal__width;
  margin: 0 auto;
  padding: 0;
}

.confirmActionDialog__icon {
  display: flex;
  position: relative;
  width: 60px;
  height: 60px;
  border: 1px solid $neutral--400;
  border-radius: 2px;

  .confirmActionDialog__svg {
    margin: auto;
    width: 36px;
  }

  .confirmActionDialog__badge {
    position: absolute;
    top: -8px;
    right: -8px;
  }
}

.confirmActionDialog__actions {
  display: flex;
  justify-content: center;
  width: 90%;
  margin: 54px;
  padding-top: 38px;
  border-top: 1px solid $neutral--300;
}
</style>
