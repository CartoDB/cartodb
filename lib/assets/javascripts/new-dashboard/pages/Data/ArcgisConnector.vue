<template>
  <Dialog ref="dialog"
    :headerTitle="getHeaderTitleFromMode"
    :headerImage="require('../../assets/icons/datasets/subsc-add-icon.svg')"
    :backRoute="{name: `${getRouteNamePrefix}new-dataset`}"
  >
  <template slot="sub-header">
    <h3 class="is-caption is-regular is-txtMidGrey u-flex u-flex__align--center">
      <img class="u-mr--8 file-icon" width="50px" :src="fileIcon" @error="setAltImage">
      {{ $t('ConnectorsPage.ArcGIS.title') }}
    </h3>
  </template>
  <template #default>
    <div class="u-flex u-flex__justify--center">
      <div class="u-flex u-flex__direction--column">
        <span v-if="!isFileSelected" class="is-semibold is-small">{{ $t('ConnectorsPage.ArcGIS.subtitle') }}</span>
        <div>
          <div v-if="!isFileSelected">
            <div class="u-flex u-mt--32">
              <label class="text is-small u-mt--12 u-mr--16">{{ $t('DataPage.url') }}</label>
              <div>
                <div class="Form-rowData Form-rowData--noMargin Form-inputWrapper Form-rowData--longer">
                  <input type="text" v-model="urlToUpload" class="Form-input Form-inputInline u-flex__grow--1 CDB-Text CDB-Size-medium" value="" :placeholder="$t('ConnectorsPage.ArcGIS.placeholder')">
                  <button type="submit" class="is-small is-semibold is-txtPrimary u-mr--12" :style="{ opacity: urlToUpload ? 1 : 0.38 }" @click="uploadUrl">
                    <span>Submit</span>
                  </button>
                </div>
                <p class="u-mt--12 text is-small is-txtMidGrey" v-html="$t('ConnectorsPage.ArcGIS.helper')">
                </p>
                <p v-if="!fileValidation.valid" class="is-small u-mt--24 is-txtAlert">{{ fileValidation.msg }}</p>
              </div>
            </div>
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
import Dialog from 'new-dashboard/components/Dialogs/Dialog.vue';
import uploadData from '../../mixins/connector/uploadData';
import UploadConfig from 'dashboard/common/upload-config';
import GuessPrivacyFooter from 'new-dashboard/components/Connector/GuessPrivacyFooter';
import DatasetSyncCard from 'new-dashboard/components/Connector/DatasetSyncCard';
import { LOCAL_FILES } from 'new-dashboard/utils/connector/local-file-option';

export default {
  name: 'ArcgisConnector',
  inject: ['backboneViews'],
  mixins: [uploadData],
  components: {
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
      return this.$route.name.replace('import-arcgis', '');
    },
    fileIcon () {
      return `${exportedScssVars.assetsDir.replace(/\"/g, '')}/images/layout/connectors/arcgis.png`;
    },
    isFileSelected () {
      return this.fileValidation.valid && this.uploadObject && !!this.uploadObject.value && !!this.uploadObject.type;
    }
  },
  methods: {
    changeSyncInterval (interval) {
      this.uploadObject.interval = interval;
    },
    setAltImage (event) {
      event.target.src = require('../../assets/icons/datasets/local-file.svg');
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
        this.uploadObject.type = 'service';
        this.uploadObject.value = this.urlToUpload;
        this.uploadObject.service_name = 'arcgis';
        this.uploadObject.service_item_id = this.urlToUpload;
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
.file-icon {
  height: 20px;
}

.Form-rowData {
  .Form-input {
    height: 36px;
  }
}

</style>
