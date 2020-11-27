<template>
  <Dialog
    :headerTitle="$t('DataPage.addDataset')"
    :headerImage="require('../../assets/icons/catalog/modal/subsc-add-icon.svg')"
  >
  <template slot="sub-header">
    <h3 class="is-caption is-regular is-txtMidGrey u-flex u-flex__align--center">
      <img class="u-mr--8" src="../../assets/icons/datasets/local-file.svg">
      {{ $t('DataPage.addLocalFile') }}
    </h3>
  </template>
    <div class="u-flex u-flex__direction--column u-flex__align--center">
      <span class="is-small">{{ $t('DataPage.formats') }}: CSV, GeoJSON, GPKG, SHP, KML, OSM, CARTO, GPX, FGDB <a target="_blank" href="https://carto.com/developers/import-api/guides/importing-geospatial-data/#supported-geospatial-data-formats">{{ $t('DataPage.learnmore') }}</a></span>
      <div ref="dragZone" :class="{dragged: dragged}" class="drag-zone u-mt--32 u-flex u-flex__direction--column u-flex__align--center u-flex__justify--center">
        <img src="../../assets/icons/datasets/move-up.svg">
        <h4 class="is-small is-semibold u-mt--16" style="text-align: center;">Drag and drop your file<br>or</h4>
        <button @click="selectFile()" class="button is-primary u-mt--16">Browse</button>
        <input @change="fileSelected" ref="file" type="file">
      </div>
      <p v-if="!fileValidation.valid" class="is-small u-mt--24 is-txtAlert">{{fileValidation.msg}}</p>
    </div>
    <template slot="footer">
      <GuessPrivacyFooter
        :guess="uploadObject.content_guessing && uploadObject.type_guessing"
        :privacy="uploadObject.privacy"
        :disabled="!fileValidation.valid"
        @guessChanged="changeGuess"
        @privacyChanged="changePrivacy"
      ></GuessPrivacyFooter>
    </template>
  </Dialog>
</template>

<script>

import Dropzone from 'dropzone';
import Dialog from 'new-dashboard/components/Dialogs/Dialog.vue';
import uploadData from '../../mixins/connector/uploadData';
import GuessPrivacyFooter from 'new-dashboard/components/Connector/GuessPrivacyFooter';
require('dragster');

export default {
  name: 'AddLocalFile',
  mixins: [uploadData],
  components: {
    Dialog,
    GuessPrivacyFooter
  },
  data () {
    return {
      dragged: false,
      fileValidation: {
        valid: false,
        msg: ''
      },
      uploadObject: this.getUploadObject()
    };
  },
  mounted () {
    this.dragster = new Dragster(this.$refs.dragZone); // eslint-disable-line
    this.$refs.dragZone.addEventListener('dragster:enter', () => {
      this.dragged = true;
    });
    this.$refs.dragZone.addEventListener('dragster:leave', () => {
      this.dragged = false;
    });
    this.dropzone = new Dropzone(this.$refs.dragZone, {
      url: ':)',
      autoProcessQueue: false,
      previewsContainer: false
    });
    this.dropzone.on('drop', e => {
      this.dragster.dragleave(event);
      this.dropzone.removeFile(event);
      this.importFile(event.dataTransfer.files);
    });
  },
  computed: {
    remainingByteQuota () {
      return this.$store.state.user && this.$store.state.user.remaining_byte_quota;
    }
  },
  methods: {
    selectFile () {
      this.$refs.file.click();
    },
    fileSelected (event) {
      this.importFile(event.target.files);
      event.target.value = '';
    },
    importFile (files) {
      if (files && files.length > 0) {
        this.fileValidation = this.validateFile(files, this.remainingByteQuota);
      }
    },
    changeGuess (value) {
      this.uploadObject.content_guessing = value;
      this.uploadObject.type_guessing = value;
    },
    changePrivacy (value) {
      this.uploadObject.privacy = value;
    }
  },
  beforeDestroy () {
    if (this.dragster) {
      this.dragster.removeListeners();
      this.dragster.reset();
    }
    this.$refs.dragZone.removeEventListener('dragster:enter');
    this.$refs.dragZone.removeEventListener('dragster:leave');
    if (this.dropzone) {
      this.dropzone.destroy();
    }
  }
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";
.drag-zone {
  width: 460px;
  height: 204px;
  border-radius: 4px;
  border: dashed 2px #dddddd;
  background-color: $white;
  transition: border-color 0.25s linear;
  >* {
    transition: opacity 0.25s linear;
  }
  &.dragged {
    border-color: $blue--500;
    >* {
      opacity: 0.5;
    }
  }
}
input[type=file] {
  display: none;
}
</style>
