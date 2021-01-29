<template>
  <Dialog ref="dialog"
    :headerTitle="getHeaderTitleFromMode"
    :headerImage="require('../../assets/icons/datasets/subsc-add-icon.svg')"
    :backRoute="{name: `${getRouteNamePrefix}new-dataset`}"
  >
  <template slot="sub-header">
    <h3 class="is-caption is-regular is-txtMidGrey u-flex u-flex__align--center">
      <img class="u-mr--8 file-icon" :src="fileIcon" @error="setAltImage">
      {{ $t('ConnectorsPage.Twitter.title') }}
    </h3>
  </template>
  <template #default>
    <div class="u-flex u-flex__justify--center">
      <div class="u-flex u-flex__direction--column">
        <span class="is-semibold is-small">{{ $t('ConnectorsPage.Twitter.subtitle') }}</span>
        <span class="is-small u-mt--8">{{ $t('ConnectorsPage.Twitter.description') }}</span>
        <div class="u-flex u-flex__align--center u-flex__justify--between u-mt--32">
          <div class="u-flex u-flex__direction--column u-flex__align--end u-flex__grow--1  u-mr--16">
            <label class="text is-small">{{ $t('ConnectorsPage.Twitter.category') }}</label>
          </div>
          <div class="Form-rowData Form-rowData--noMargin Form-inputWrapper">
            <input type="text" v-model="urlToUpload" class="Form-input Form-inputInline u-flex__grow--1 CDB-Text CDB-Size-medium" value="" :placeholder="$t('ConnectorsPage.Twitter.categoryPlaceholder')">
          </div>
        </div>
        <div class="u-flex u-flex__align--center u-flex__justify--between u-mt--16">
          <div class="u-flex u-flex__align--center u-flex__grow--1">
            <div class="u-flex u-flex__direction--column u-flex__align--end u-flex__grow--1  u-mr--16">
              <label class="text is-small">{{ $t('ConnectorsPage.Twitter.startDate') }}</label>
            </div>
            <div class="Form-rowData Form-rowData--noMargin Form-inputWrapper Form-rowData--short">
              <input type="date" class="Form-input Form-inputInline u-flex__grow--1 CDB-Text CDB-Size-medium" value="">
            </div>
          </div>
          <div class="u-flex u-flex__align--center u-ml--24">
            <label class="text is-small u-mr--16">{{ $t('ConnectorsPage.Twitter.time') }}</label>
            <div class="Form-rowData Form-rowData--noMargin Form-inputWrapper Form-rowData--shorter u-mr--8">
              <input type="number" min="0" max="23" class="Form-input Form-inputInline u-flex__grow--1 CDB-Text CDB-Size-medium" value="">
            </div>
            <div class="Form-rowData Form-rowData--noMargin Form-inputWrapper Form-rowData--shorter">
              <input type="number" min="0" max="59" class="Form-input Form-inputInline u-flex__grow--1 CDB-Text CDB-Size-medium" value="">
            </div>
          </div>
        </div>
        <div class="u-flex u-flex__align--center u-flex__justify--between u-mt--16">
          <div class="u-flex u-flex__align--center u-flex__grow--1">
            <div class="u-flex u-flex__direction--column u-flex__align--end u-flex__grow--1  u-mr--16">
              <label class="text is-small">{{ $t('ConnectorsPage.Twitter.endDate') }}</label>
            </div>
            <div class="Form-rowData Form-rowData--noMargin Form-inputWrapper Form-rowData--short">
              <input type="date" class="Form-input Form-inputInline u-flex__grow--1 CDB-Text CDB-Size-medium" value="">
            </div>
          </div>
          <div class="u-flex u-flex__align--center u-ml--24">
            <label class="text is-small u-mr--16">{{ $t('ConnectorsPage.Twitter.time') }}</label>
            <div class="Form-rowData Form-rowData--noMargin Form-inputWrapper Form-rowData--shorter u-mr--8">
              <input type="number" min="0" max="23" class="Form-input Form-inputInline u-flex__grow--1 CDB-Text CDB-Size-medium" value="">
            </div>
            <div class="Form-rowData Form-rowData--noMargin Form-inputWrapper Form-rowData--shorter">
              <input type="number" min="0" max="59" class="Form-input Form-inputInline u-flex__grow--1 CDB-Text CDB-Size-medium" value="">
            </div>
          </div>
        </div>
        <div class="u-flex u-flex__align--center u-flex__justify--between">
          <div></div>
          <div class="Form-rowData Form-rowData--noMargin">
            <p class="is-small is-txtSoftGrey">{{ $t('ConnectorsPage.Twitter.gmt', { gmt: getYouGMT }) }}</p>
          </div>
        </div>
        <div class="u-flex u-flex__align--start u-flex__justify--between u-mt--8">
          <div class="u-flex u-flex__direction--column u-flex__align--end u-flex__grow--1  u-mr--16" style="margin-top:2px;">
            <label class="text is-small">{{ $t('ConnectorsPage.Twitter.use') }}</label>
          </div>
          <div class="Form-rowData Form-rowData--noMargin">
            <div class="u-width--100">
              <input class="u-flex__grow--1" type="range" min="0" max="100">
              <p class="is-small is-txtSoftGrey u-mt--8"><span class="is-txtMainTextColor is-semibold">50%</span> {{ $t('ConnectorsPage.Twitter.remaining', { quota: twitterQuota }) }}</p>
            </div>
          </div>
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
import { mapState } from 'vuex';
import moment from 'moment';

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
      uploadObject: this.getUploadObject()
    };
  },
  computed: {
    ...mapState({
      twitterQuota: state => state.user && state.user.twitter && state.user.twitter.quota
    }),
    getRouteNamePrefix () {
      return this.$route.name.replace('import-twitter', '');
    },
    fileIcon () {
      return `${exportedScssVars.assetsDir.replace(/\"/g, '')}/images/layout/connectors/twitter.svg`;
    },
    getYouGMT () {
      return moment().format('Z');
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
  height: 28px;
}

.Form-rowData {
  .Form-input {
    height: 36px;
  }
  input {
    width: 100%;
  }
}

.Form-rowData--shorter {
  width: 56px;
}

.Form-rowData--short {
  width: 192px;
}

input[type=range] {
  -moz-appearance: auto;
  -webkit-appearance: auto;
  appearance: auto;
  width: 100%;
}

</style>
