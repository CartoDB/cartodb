<template>
  <Modal ref="deleteKuvizModal" name="deleteKuvizModal">
    <div class="kuviz__modal">
      <div class="kuviz__modal-inner">
        <div class="kuviz__icon kuviz__icon--alert u-mb--24">
          <img class="kuviz__svgicon" svg-inline src="new-dashboard/assets/icons/kuvizs/trash.svg">
          <span class="kuviz__badge kuviz__badge--delete text is-xsmall">{{ $t(`KuvizModals.delete.alertCount`) }}</span>
        </div>
        <p class="text is-caption u-mb--8" v-html="$t('KuvizModals.delete.title', { name: kuviz.name })"></p>
        <p class="text is-small is-txtSoftGrey" v-html="$t('KuvizModals.delete.subtitle')"></p>
        <div class="kuviz__modal-actions">
          <button class="kuviz__modal-button u-mr--12" @click="close">{{ $t(`KuvizModals.delete.cancelButton`) }}</button>
          <button class="kuviz__modal-button kuviz__modal-button--delete" @click="deleteKuviz">{{ $t(`KuvizModals.delete.deleteButton`) }}</button>
        </div>
      </div>
    </div>
  </Modal>
</template>

<script>
import Modal from 'new-dashboard/components/Modal';

export default {
  name: 'DeleteKuvizModal',
  components: {
    Modal
  },
  props: {
    kuviz: {
      type: Object,
      required: true
    }
  },
  methods: {
    open () {
      this.$refs.deleteKuvizModal.open();
    },
    close () {
      this.$refs.deleteKuvizModal.close();
    },
    deleteKuviz () {
      this.$store.dispatch('kuvizs/delete', this.kuviz)
        .then(() => {
          this.$store.dispatch('kuvizs/fetchVisualizations')
        });
      this.close();
    }
  }
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';
@import './modal-styles.scss';
</style>
