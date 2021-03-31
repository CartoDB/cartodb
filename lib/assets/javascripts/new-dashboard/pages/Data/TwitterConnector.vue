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
        <div v-for="(category, index) in categories" :key="index" class="u-flex u-flex__align--center u-flex__justify--between u-mt--32">
          <div class="u-flex u-flex__direction--column u-flex__align--end u-flex__grow--1  u-mr--16">
            <label class="text is-small">{{ $t('ConnectorsPage.Twitter.category') }} {{ index + 1 }}</label>
          </div>
          <div class="Form-rowData Form-rowData--noMargin Form-inputWrapper">
            <input type="text" v-model="categories[index]" @keydown="onCategoriesChange" class="Form-input Form-inputInline u-flex__grow--1 CDB-Text CDB-Size-medium" :placeholder="$t('ConnectorsPage.Twitter.categoryPlaceholder')">
          </div>
        </div>
        <div class="u-flex u-flex__align--center u-flex__justify--between u-mt--16">
          <div class="u-flex u-flex__align--center u-flex__grow--1">
            <div class="u-flex u-flex__direction--column u-flex__align--end u-flex__grow--1  u-mr--16">
              <label class="text is-small">{{ $t('ConnectorsPage.Twitter.startDate') }}</label>
            </div>
            <div class="Form-rowData Form-rowData--noMargin Form-inputWrapper Form-rowData--short">
              <input type="date" v-model="fromDate" class="Form-input Form-inputInline u-flex__grow--1 CDB-Text CDB-Size-medium">
            </div>
          </div>
          <div class="u-flex u-flex__align--center u-ml--24">
            <label class="text is-small u-mr--16">{{ $t('ConnectorsPage.Twitter.time') }}</label>
            <div class="Form-rowData Form-rowData--noMargin Form-inputWrapper Form-rowData--shorter time u-mr--8">
              <input type="number" v-model="startTime.hour" min="0" max="23" class="Form-input Form-inputInline u-flex__grow--1 CDB-Text CDB-Size-medium">
            </div>
            <div class="Form-rowData Form-rowData--noMargin Form-inputWrapper Form-rowData--shorter time">
              <input type="number" v-model="startTime.min" min="0" max="59" class="Form-input Form-inputInline u-flex__grow--1 CDB-Text CDB-Size-medium">
            </div>
          </div>
        </div>
        <div class="u-flex u-flex__align--center u-flex__justify--between u-mt--16">
          <div class="u-flex u-flex__align--center u-flex__grow--1">
            <div class="u-flex u-flex__direction--column u-flex__align--end u-flex__grow--1  u-mr--16">
              <label class="text is-small">{{ $t('ConnectorsPage.Twitter.endDate') }}</label>
            </div>
            <div class="Form-rowData Form-rowData--noMargin Form-inputWrapper Form-rowData--short">
              <input type="date" class="Form-input Form-inputInline u-flex__grow--1 CDB-Text CDB-Size-medium" v-model="toDate">
            </div>
          </div>
          <div class="u-flex u-flex__align--center u-ml--24">
            <label class="text is-small u-mr--16">{{ $t('ConnectorsPage.Twitter.time') }}</label>
            <div class="Form-rowData Form-rowData--noMargin Form-inputWrapper Form-rowData--shorter time u-mr--8">
              <input type="number" v-model="endTime.hour" min="0" max="23" class="Form-input Form-inputInline u-flex__grow--1 CDB-Text CDB-Size-medium">
            </div>
            <div class="Form-rowData Form-rowData--noMargin Form-inputWrapper Form-rowData--shorter time">
              <input type="number" v-model="endTime.min" min="0" max="59" class="Form-input Form-inputInline u-flex__grow--1 CDB-Text CDB-Size-medium">
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
              <input class="u-flex__grow--1" v-model="quota" type="range" min="0" max="100">
              <p class="is-small is-txtSoftGrey u-mt--8"><span class="is-txtMainTextColor is-semibold">{{quota}}%</span> {{ $t('ConnectorsPage.Twitter.remaining', { quota: twitterQuota }) }}</p>
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
        :disabled="!isValidModel"
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
import { LOCAL_FILES } from 'new-dashboard/utils/connector/local-file-option';
import { mapState } from 'vuex';
import { format, subDays } from 'date-fns';
import moment from 'moment';

const MAX_TERMS = 29;
const MAX_CATEGORIES = 4;
const BACKSPACE_KEY = 'Backspace';
const MAX_COUNTER = 1014;
const CHAR_MAP = {
  ' ': 2,
  '-': 2,
  '_': 2,
  '.': 2
};

export default {
  name: 'ArcgisConnector',
  inject: ['backboneViews'],
  mixins: [uploadData],
  components: {
    Dialog,
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
      categories: [''],
      fromDate: this.getDateFormatted(subDays(new Date(), 29)),
      toDate: this.getDateFormatted(new Date()),
      startTime: {
        hour: new Date().getUTCHours(),
        min: new Date().getUTCMinutes()
      },
      endTime: {
        hour: new Date().getUTCHours(),
        min: new Date().getUTCMinutes()
      },
      quota: 50,
      localFiles: LOCAL_FILES,
      supportedFormats: UploadConfig.fileExtensions,
      extension: this.$route.params.extension,
      uploadObject: this.getUploadObject(this.$store.state.user.account_type)
    };
  },
  computed: {
    ...mapState({
      twitterQuota: state => state.user && state.user.twitter && state.user.twitter.quota
    }),
    isValidModel () {
      return !!this.model.categories.length;
    },
    model () {
      return {
        categories: this.categories.filter(cat => !!cat).map((cat, index) => {
          const terms = cat.split(',');
          return {
            terms,
            category: index + 1,
            count: this.calculeCounter(terms)
          };
        }),
        dates: {
          fromDate: this.fromDate,
          toDate: this.toDate,
          fromHour: this.startTime.hour,
          toHour: this.endTime.hour,
          fromMin: this.startTime.min,
          toMin: this.endTime.min
        }
      };
    },
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
    onCategoriesChange (event) {
      const inputValue = event.target.value;
      if (inputValue) {
        const terms = inputValue.split(',');

        if (terms.length > MAX_TERMS && event.key !== BACKSPACE_KEY) {
          event.preventDefault();
        }
      }
    },
    calculeCounter (terms) {
      let count = MAX_COUNTER;
      if (terms.length > 1) {
        count = count - ((terms.length - 1) * 4);
      }

      terms.forEach(term => {
        term.split('').forEach(char => {
          if (CHAR_MAP[char]) {
            count = count - CHAR_MAP[char];
          } else {
            count -= 1;
          }
        });
      });

      return Math.max(0, count);
    },
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
    getDateFormatted (date) {
      return `${format(date, 'YYYY-MM-DD')}`;
    },
    connectDataset () {
      if (this.isValidModel) {
        this.uploadObject.type = 'service';
        this.uploadObject.value = this.model;
        this.uploadObject.service_name = 'twitter_search';
        this.uploadObject.service_item_id = this.model;
        this.uploadObject.user_defined_limits = {
          twitter_credits_limit: this.quota
        };

        const backgroundPollingView = this.backboneViews.backgroundPollingView.getBackgroundPollingView();
        backgroundPollingView._addDataset({ ...this.uploadObject });
        this.$refs.dialog.closePopup();
      }
    }
  },
  watch: {
    categories: {
      handler () {
        const categoriesSize = this.categories.length;
        if (this.categories[categoriesSize - 1]) {
          if (categoriesSize < MAX_CATEGORIES) {
            this.categories.push('');
          }
        }
        if (categoriesSize >= 2 && !this.categories[categoriesSize - 2]) {
          this.categories.splice(categoriesSize - 2, 1);
        }
      },
      deep: true
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

.time {
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
