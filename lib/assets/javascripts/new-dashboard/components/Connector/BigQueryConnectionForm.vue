<template>
  <div class="u-flex u-flex__justify--center">
    <div class="main u-flex u-flex__align--center u-flex__direction--column">
      <!-- DISCLAIMER -->
      <div v-if="showDisclaimer" class="disclaimer">
        <h4 class="is-subtitle is-semibold u-mt--16">{{$t('ConnectorsPage.BigQuery.title')}}</h4>
        <ul class="u-mt--16">
          <li class="u-mb--16">
            <span class="text is-caption">{{$t('ConnectorsPage.BigQuery.disclaimer1')}}</span>
          </li>
          <li class="u-mb--16">
            <span class="text is-caption">{{$t('ConnectorsPage.BigQuery.disclaimer2')}}</span>
          </li>
          <li class="u-mb--16">
            <span class="text is-caption">{{$t('ConnectorsPage.BigQuery.disclaimer3')}}</span>
          </li>
          <li class="u-mb--16">
            <span class="text is-caption">{{$t('ConnectorsPage.BigQuery.disclaimer4')}}</span>
          </li>
          <li class="u-mb--16">
            <span class="text is-caption" v-html="$t('ConnectorsPage.BigQuery.disclaimer5')"></span>
          </li>
        </ul>
        <div class="u-mt--48 u-flex u-flex__justify--center u-flex__align--center">
          <button @click="cancel" class="is-small is-semibold is-txtPrimary">{{$t('ConnectorsPage.BigQuery.conditions.cancel')}}</button>
          <button @click="accept" class="button is-primary u-ml--36">{{$t('DataPage.continue')}}</button>
        </div>
      </div>
      <!-- UPLOAD FILE -->
      <div v-else-if="!showDisclaimer && !isServiceAccountValid">
        <div class="section-header is-semibold is-small u-mb--4">
          {{$t('ConnectorsPage.BigQuery.fileInputLabel')}}
        </div>
        <div class="text is-small is-txtMidGrey u-mb--24" v-html="$t('ConnectorsPage.BigQuery.fileInputHelper')"></div>
        <FileInput
          :supportedFormats="supportedFormats"
          @change="onFileChange" :reduced="true"></FileInput>
        <div class="u-flex u-flex__justify--end u-mt--32">
          <button @click="cancel" class="u-mr--28 is-small is-semibold is-txtPrimary">{{$t('ConnectorsPage.cancel')}}</button>
          <button @click="uploadServiceAccount" class="CDB-Button CDB-Button--primary CDB-Button--big" :class="{'is-disabled': !isFileSelected}">
            <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium">
              {{ $t('DataPage.continue') }}
            </span>
          </button>
        </div>
      </div>
      <!-- LAST STEP -->
      <div v-else-if="!showDisclaimer && isServiceAccountValid" class="u-flex u-flex__direction--column">
        <div class="section-header is-semibold is-small u-mb--4">
          {{$t('ConnectorsPage.BigQuery.billingProject')}}
        </div>
        <div class="text is-small is-txtMidGrey u-mb--24" v-html="$t('ConnectorsPage.BigQuery.billingHelper')"></div>
        <SelectComponent v-model="connectionModel.billing_project" :elements="projects"></SelectComponent>
        <div class="error-wrapper text is-small is-txtAlert u-flex u-flex__justify--start u-mt--16" v-if="error">
          {{ error }}
        </div>
        <div class="u-flex u-flex__justify--end u-mt--32">
          <button @click="cancel" class="u-mr--28 is-small is-semibold is-txtPrimary">{{$t('ConnectorsPage.cancel')}}</button>
          <button @click="connect" class="CDB-Button CDB-Button--primary CDB-Button--big" :class="{'is-disabled': (!connectionModelIsValid || submited)}">
            <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium">
              {{ $t('DataPage.connect') }}
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>

import FileInput from 'new-dashboard/components/forms/FileInput';
import SelectComponent from 'new-dashboard/components/forms/SelectComponent';
import uploadData from '../../mixins/connector/uploadData';
import { validateEmail } from 'new-dashboard/utils/email-validation';
import { mapState } from 'vuex';

const SERVICE_ACCOUNT_EXTENSION = 'json';

export default {
  name: 'BigQueryConnectionForm',
  components: {
    FileInput,
    SelectComponent
  },
  mixins: [uploadData],
  data () {
    return {
      error: '',
      file: null,
      showDisclaimer: true,
      dragged: false,
      submited: false,
      projects: null,
      userAccount: null,
      serviceAccount: null,
      connectionModel: {
        name: 'BigQuery',
        email: null,
        billing_project: null,
        default_project: null
      },
      supportedFormats: [SERVICE_ACCOUNT_EXTENSION],
      fileValidation: {
        valid: false,
        msg: ''
      }
    };
  },
  computed: {
    ...mapState({
      email: state => state.user.email
    }),
    connectionModelIsValid () {
      return this.connectionModel.name &&
        this.connectionModel.billing_project;
    },
    isFileSelected () {
      return this.file;
    },
    isServiceAccountValid () {
      // If there are projects, means that ServiceAccount is valid :)
      return this.projects && this.projects.length;
    }
  },
  methods: {
    cancel () {
      this.$emit('cancel');
    },
    accept () {
      this.showDisclaimer = false;
    },
    onFileChange (file) {
      this.file = file;
    },
    validateEmail (email) {
      return validateEmail(email);
    },
    async connect () {
      try {
        this.error = '';
        this.submited = true;
        this.connectionModel.default_project = this.connectionModel.billing_project;
        this.connectionModel.email = this.email;
        const response = await this.$store.dispatch('connectors/createNewBQConnection', { ...this.serviceAccount, ...this.connectionModel });
        this.submited = false;
        this.$emit('connectionSuccess', response.id);
      } catch (error) {
        this.submited = false;
        this.error = this.$t('DataPage.imports.database.connection-error');
      }
    },
    async uploadServiceAccount () {
      if (!this.file) {
        return;
      }
      const serviceAccount = await this.file.text();
      this.serviceAccount = JSON.parse(serviceAccount);

      try {
        this.error = '';
        this.projects = (await this.$store.dispatch('connectors/checkServiceAccount', serviceAccount)).map(p => ({ id: p.id, label: p.friendly_name }));
        this.connectionModel.billing_project = this.projects[0].id;
      } catch (e) {
        this.error = this.$t('ConnectorsPage.BigQuery.serviceAccountError');
      }
    }
  }
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";

.helper {
  max-width: 512px;
}

.main {
  max-width: 460px;
}
.disclaimer {
  width: 620px;

  h4 {
    text-align: center;
  }
}

.section-header {
  position: relative;
  line-height: 24px;

  .number {
    position: absolute;
    height: 24px;
    width: 24px;
    left: -36px;
    border-radius: 4px;
    border: 1px solid $neutral--800;
  }
}

.error-wrapper {
  position: relative;
  padding: 16px 16px 16px 44px;
  background-color: #fde8e7;
  border-radius: 4px;

  &:before {
    content: '';
    position: absolute;
    display: block;
    background-image: url("../../assets/icons/common/error.svg");
    height: 24px;
    width: 24px;
    top: 12px;
    left: 12px;
  }
}

.select-wrapper {
  &::v-deep {
    select {
      width: 460px;
    }
  }
}

input {
  width: 512px;
  border: solid 1px #dddddd;
  border-radius: 4px;
  background-color: $white;
  font-size: 12px;
  color: $neutral--800;
  padding: 12px;
  height: 40px;

  &#email {
    cursor: text;
    width: 100%;
  }

  &::placeholder {
    color: rgba(46, 60, 67, 0.48);
  }

  &:-ms-input-placeholder {
    color: rgba(46, 60, 67, 0.48);
  }

  &::-ms-input-placeholder {
    color: rgba(46, 60, 67, 0.48);
  }
}
</style>
