<template>
  <Modal ref="certificateDownloadDialog" name="certificateDownload" :canCloseWithClickOrEsc="isCertificateDownloaded">
    <div class="certificateDownloadDialog">
      <div class="certificateDownloadDialog__content">
        <div class="certificateDownloadDialog__icon u-mb--24">
          <img class="certificateDownloadDialog__svg" svg-inline src="new-dashboard/assets/icons/certificates/lock.svg">
          <img class="certificateDownloadDialog__badge" svg-inline src="new-dashboard/assets/icons/common/check-bubble.svg">
        </div>

        <p class="text is-caption u-mb--8">
          Your <span class="is-bold">new certificate</span> has been created
        </p>

        <p class="text is-small is-txtSoftGrey certificateDownloadDialog__description">
          The ZIP file contains the certificate files along with information about the parameters for setting up your connection.
        </p>

        <p class="text is-small is-txtGrey">
          ⚠️ Before you can close this dialog, you must download your certificate. The file will not be accessible after this dialog is closed.
        </p>
      </div>

      <div class="certificateDownloadDialog__footer">
        <!-- resetear status de downloadState -->
        <ActionButton
          activeText="DOWNLOAD .ZIP"
          waitingText="DOWNLOADING"
          readyText="CLOSE WINDOW"
          :action="onDownloadClick"
          @ready="onDownloadFinish"></ActionButton>
      </div>
    </div>
  </Modal>
</template>

<script>
import Modal from 'new-dashboard/components/Modal';
import ActionButton from 'new-dashboard/components/forms/ActionButton';

export default {
  name: 'CertificateDownloadModal',
  components: {
    Modal,
    ActionButton
  },
  data () {
    return {
      downloadState: 'active',
      isCertificateDownloaded: false
    };
  },
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
    },
    onDownloadClick () {
      return new Promise(resolve => {
        setTimeout(() => { resolve(); }, 2000);
      });
    },
    onDownloadFinish () {
      if (this.isCertificateDownloaded) {
        this.close();
      }

      this.isCertificateDownloaded = true;
    }
  }
};
</script>

<style lang="scss" scoped>
@import 'new-dashboard/styles/variables';

.certificateDownloadDialog {
  display: flex;
  flex-direction: column;
  justify-content: center;
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
    width: 36px;
  }

  .certificateDownloadDialog__badge {
    position: absolute;
    top: -8px;
    right: -8px;
    width: 22px;
    height: 22px;
    fill: $green--800;
  }
}

.certificateDownloadDialog__description {
  width: 460px;
  margin-bottom: 60px;
  text-align: center;
}

.certificateDownloadDialog__footer {
  display: flex;
  justify-content: center;
  width: 90%;
  margin: 20px auto 0 auto;
  border-top: 1px solid $settings_border-color;
  padding-top: 35px;
}
</style>
