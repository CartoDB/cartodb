<template>
  <Dialog ref="dialog"
    :headerTitle="getHeaderTitleFromMode"
    :headerImage="require('../../assets/icons/datasets/subsc-add-icon.svg')"
    :backRoute="{name: `${getRouteNamePrefix}new-dataset`}"
  >
  <template slot="sub-header">
    <h3 class="is-caption is-regular is-txtMidGrey u-flex u-flex__align--center">
      <img class="u-mr--8 file-icon" :src="fileIcon" @error="setAltImage">
      {{ $t('DataPage.importLocalFile', { format: typeName }) }}
    </h3>
  </template>
  <template #default>
    <div class="u-flex u-flex__justify--center">
      <div class="u-flex u-flex__direction--column" :class="{main: extension !== 'url'}">
        <div v-if="extension !== 'url'">
          <div v-if="!isFileSelected" class="u-flex u-flex__direction--column u-mb--32">
            <span class="is-small is-semibold u-mb--8"> {{ $t('DataPage.dataPreparation') }}</span>
            <div class="text is-small is-txtMidGrey" v-html="$t(`DataPage.messageHelper${typeNameNotWhiteSpaces}`)">
            </div>
          </div>
          <FileInput
            label=""
            :supportedFormats="supportedFormats"
            :reduced="true"
            @change="onFileChange"></FileInput>
          <p v-if="!fileValidation.valid" class="is-small u-mt--24 is-txtAlert url-error">{{fileValidation.msg}}</p>
        </div>
        <div v-else>
          <!-- IF YOU WANT TO UPLOAD AN URL -->

          <div v-if="!isFileSelected">
            <span v-if="!isFileSelected" class="u-flex is-small u-flex__justify--center"><span>{{ $t('DataPage.formats') }}: CSV, GeoJSON, GPKG, SHP, KML, OSM, CARTO, GPX, FGDB. <a target="_blank" href="https://carto.com/developers/import-api/guides/importing-geospatial-data/#supported-geospatial-data-formats">{{ $t('DataPage.learnmore') }}</a></span></span>
            <div class="u-flex u-flex__align--center u-mt--32">
              <label class="text is-small u-mr--16">{{ $t('DataPage.url') }}</label>
              <div class="Form-rowData Form-rowData--noMargin Form-inputWrapper Form-rowData--longer">
                <input type="text" v-model="urlToUpload" class="Form-input Form-inputInline u-flex__grow--1 CDB-Text CDB-Size-medium" value="" placeholder="https://carto.com/data-library" />
                <button type="submit" class="is-small is-semibold is-txtPrimary u-mr--12" :style="{ opacity: urlToUpload ? 1 : 0.38 }" @click="uploadUrl">
                  <span>Submit</span>
                </button>
              </div>
            </div>
            <p v-if="!fileValidation.valid" class="is-small u-mt--24 is-txtAlert url-error">{{fileValidation.msg}}</p>
          </div>
          <template v-else>
            <div class="u-flex u-flex__align--center u-flex__justify--center">
              <DatasetSyncCard
                :name="uploadObject.value"
                fileType="URL" isActive
                @inputChange="changeSyncInterval">
              </DatasetSyncCard>
            </div>
          </template>
        </div>
      </div>
    </div>
  </template>
    <template slot="footer">
      <GuessPrivacyFooter
        :guess="uploadObject.content_guessing && uploadObject.type_guessing"
        :privacy="uploadObject.privacy"
        :disabled="!fileValidation.valid"
        @guessChanged="changeGuess"
        @privacyChanged="changePrivacy"
        @connect="connectDataset"
      ></GuessPrivacyFooter>
    </template>
  </Dialog>
</template>

<script>

import exportedScssVars from 'new-dashboard/styles/helpers/_assetsDir.scss';
import FileInput from 'new-dashboard/components/forms/FileInput';
import Dialog from 'new-dashboard/components/Dialogs/Dialog.vue';
import uploadData from '../../mixins/connector/uploadData';
import UploadConfig from 'dashboard/common/upload-config';
import GuessPrivacyFooter from 'new-dashboard/components/Connector/GuessPrivacyFooter';
import DatasetSyncCard from 'new-dashboard/components/Connector/DatasetSyncCard';
import { LOCAL_FILES } from 'new-dashboard/utils/connector/local-file-option';

export default {
  name: 'AddLocalFile',
  inject: ['backboneViews'],
  mixins: [uploadData],
  components: {
    FileInput,
    Dialog,
    DatasetSyncCard,
    GuessPrivacyFooter
  },
  props: {
    mode: String
  },
  data () {
    return {
      urlToUpload: '',
      fileValidation: {
        valid: false,
        msg: ''
      },
      localFiles: LOCAL_FILES,
      supportedFormats: UploadConfig.fileExtensions,
      extension: this.$route.params.extension,
      uploadObject: this.getUploadObject(this.$store.state.user.account_type)
    };
  },
  computed: {
    getRouteNamePrefix () {
      return this.$route.name.replace('add-local-file', '');
    },
    typeName () {
      return (this.localFiles.find(lf => lf.id === this.extension) || {}).label || this.$t('DataPage.defaultLocalFile');
    },
    typeNameNotWhiteSpaces () {
      return this.typeName.replace(/\s/g, '_');
    },
    fileIcon () {
      return `${exportedScssVars.assetsDir.replace(/\"/g, '')}/images/layout/connectors/${this.extension}.svg`;
    },
    remainingByteQuota () {
      return this.$store.state.user && this.$store.state.user.remaining_byte_quota;
    },
    isFileSelected () {
      return this.fileValidation.valid && this.uploadObject && !!this.uploadObject.value && !!this.uploadObject.type;
    }
  },
  methods: {
    clearFile () {
      this.uploadObject.type = '';
      this.uploadObject.value = '';
      this.fileValidation = {
        valid: false,
        msg: ''
      };
    },
    changeSyncInterval (interval) {
      this.uploadObject.interval = interval;
    },
    setAltImage (event) {
      event.target.src = require('../../assets/icons/datasets/local-file.svg');
    },
    onFileChange (file) {
      this.setFile(file);
    },
    setFile (file) {
      if (file) {
        this.fileValidation = this.validateFile([file], this.remainingByteQuota);
        if (this.fileValidation.valid) {
          this.uploadObject.type = 'file';
          this.uploadObject.value = file;
        }
      } else {
        this.clearFile();
      }
    },
    changeGuess (value) {
      this.uploadObject.content_guessing = value;
      this.uploadObject.type_guessing = value;
    },
    changePrivacy (value) {
      this.uploadObject.privacy = value;
    },
    uploadUrl () {
      this.fileValidation = this.validateUrl(this.urlToUpload);

      if (this.fileValidation.valid) {
        this.uploadObject.type = 'url';
        this.uploadObject.value = this.urlToUpload;
      }
    },
    connectDataset () {
      if (this.isFileSelected) {
        const backgroundPollingView = this.backboneViews.backgroundPollingView.getBackgroundPollingView();
        backgroundPollingView._addDataset({ ...this.uploadObject });
        this.$refs.dialog.closePopup();
      }
    }
  }
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";
.main {
  width: 460px;
}
.file-icon {
  height: 20px;
}

.Form-rowData {
  .Form-input {
    height: 36px;
  }
}

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
.file {
  background-color: $white;
  height: 74px;
  max-width: 460px;
  border-radius: 4px;
  border: 1px solid $blue--500;
  margin: 0 auto;
}

.file-main {
  max-width: calc(100% - 24px);

  .url-text {
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
  }
}

.url-error {
  text-align: center;
}
</style>
