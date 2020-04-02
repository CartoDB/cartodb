<template>
  <Modal ref="confirmActionDialog" :name="`confirmActionDialog-${modalId}`">
    <div class="confirmActionDialog">
      <div class="confirmActionDialog__content">
        <div class="confirmActionDialog__icon u-mb--24">
          <img class="confirmActionDialog__svg" svg-inline src="new-dashboard/assets/icons/apps/default.svg">
          <img class="confirmActionDialog__badge" svg-inline src="new-dashboard/assets/icons/apps/key.svg">
        </div>

        <p class="text is-caption u-mb--8">
          {{ title }}
        </p>

        <p class="text is-small is-txtSoftGrey">
          {{ description }}
        </p>

        <div class="confirmActionDialog__actions">
          <button class="button u-mr--12" @click="close">
            {{ cancelText }}
          </button>

          <button class="button button--alert" @click="confirm">
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
  name: 'DestructiveActionDialog',
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
  width: 960px;
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
  width: 100%;
  margin-top: 54px;
  padding-top: 38px;
  border-top: 1px solid $neutral--300;
}

// .oauthapps__modal-button {
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   padding: 12px 18px;
//   border: 1px solid $color-primary;
//   border-radius: 4px;
//   background-color: transparent;
//   color: $color-primary;
//   font-family: 'Open Sans', sans-serif;
//   font-size: 12px;
//   font-weight: 600;
//   letter-spacing: 0;
//   text-transform: uppercase;
//   cursor: pointer;

//   &:hover {
//     background-color: transparent;
//     text-decoration: underline;
//   }

//   &--regenerate,
//   &--delete {
//     border: none;
//     background-color: $button-alert__bg-color;
//     color: $white;

//     &:hover {
//       background-color: $button-alert__bg-color--hover;
//       text-decoration: none;
//     }
//   }
// }
</style>
