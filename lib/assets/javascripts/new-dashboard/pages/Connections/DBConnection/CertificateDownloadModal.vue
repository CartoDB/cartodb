<template>
  <Modal ref="certificateDownloadDialog" name="certificateDownload">
    <div class="certificateDownloadDialog">
      <div class="certificateDownloadDialog__content">
        <div class="certificateDownloadDialog__icon u-mb--24">
          <img class="certificateDownloadDialog__svg" svg-inline src="new-dashboard/assets/icons/apps/default.svg">
          <img class="certificateDownloadDialog__badge" svg-inline src="new-dashboard/assets/icons/apps/key.svg">
        </div>

        <p class="text is-caption u-mb--8">
          Your <span class="is-bold">new certificate</span> has been created
        </p>

        <p class="text is-small is-txtSoftGrey">
          The ZIP file contains the certificate files along with information about the parameters for setting up your connection.
        </p>
      </div>
    </div>
  </Modal>
</template>

<script>
import Modal from 'new-dashboard/components/Modal';

export default {
  name: 'CertificateDownloadModal',
  components: { Modal },
  props: {
    certificate: {
      type: Object,
      default: () => ({})
    }
  },
  methods: {
    open () {
      this.$refs.certificateDownloadDialog.open();
    },
    close () {
      this.$refs.certificateDownloadDialog.close();
    }
  }
};
</script>

<style lang="scss" scoped>
@import 'new-dashboard/styles/variables';

.certificateDownloadDialog {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  width: 100%;
  height: 100%;
}

.certificateDownloadDialog__content {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 960px;
  margin: 0 auto;
  padding: 0;
}

.certificateDownloadDialog__icon {
  display: flex;
  position: relative;
  width: 60px;
  height: 60px;
  border: 1px solid $neutral--400;
  border-radius: 2px;

  .certificateDownloadDialog__svg {
    margin: auto;
  }

  .certificateDownloadDialog__badge {
    position: absolute;
    top: -8px;
    right: -8px;
  }
}

.certificateDownloadDialog__actions {
  display: flex;
  justify-content: center;
  width: 100%;
  margin-top: 54px;
  padding-top: 38px;
  border-top: 1px solid $neutral--300;
}
</style>
