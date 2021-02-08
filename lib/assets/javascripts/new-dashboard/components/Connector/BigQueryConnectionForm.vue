<template>
  <div class="u-flex u-flex__justify--center">
    <div class="main u-flex u-flex__align--center u-flex__direction--column">
      <!-- DISCLAIMER -->
      <div v-if="showDisclaimer" class="disclaimer">
        <h4 class="is-small is-semibold u-mt--16">{{$t('ConnectorsPage.BigQuery.title')}}</h4>
        <ul class="u-mt--8">
          <li class="u-mb--16">
            <span class="text is-small" v-html="$t('ConnectorsPage.BigQuery.disclaimer1')"></span>
          </li>
          <li class="u-mb--16">
            <span class="text is-small" v-html="$t('ConnectorsPage.BigQuery.disclaimer2')"></span>
          </li>
          <li class="u-mb--16">
            <span class="text is-small" v-html="$t('ConnectorsPage.BigQuery.disclaimer3')"></span>
          </li>
          <li class="u-mb--16">
            <span class="text is-small" v-html="$t('ConnectorsPage.BigQuery.disclaimer4')"></span>
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
          <div class="is-small is-txtAlert u-flex u-flex__justify--start u-mt--12" v-if="formatError">
            <span v-html="formatError"></span>
          </div>
          <ErrorMessage v-if="error" :message="error" :moreInfo="moreInfoError"></ErrorMessage>
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
        <ErrorMessage v-if="error" :message="error" :moreInfo="moreInfoError"></ErrorMessage>

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
import ErrorMessage from 'new-dashboard/components/ErrorMessage/ErrorMessage';
import SelectComponent from 'new-dashboard/components/forms/SelectComponent';
import uploadData from '../../mixins/connector/uploadData';
import { validateEmail } from 'new-dashboard/utils/email-validation';
import { mapState } from 'vuex';

const SERVICE_ACCOUNT_EXTENSION = 'json';

export default {
  name: 'BigQueryConnectionForm',
  components: {
    FileInput,
    SelectComponent,
    ErrorMessage
  },
  mixins: [uploadData],
  props: {
    connection: null
  },
  data () {
    return {
      error: '',
      moreInfoError: '',
      formatError: '',
      file: null,
      showDisclaimer: !this.$props.connection,
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
    editing () {
      return !!this.connection;
    },
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
      this.error = '';
      this.moreInfoError = '';
      this.formatError = '';
    },
    validateEmail (email) {
      return validateEmail(email);
    },
    async connect () {
      try {
        this.error = '';
        this.moreInfoError = '';
        this.formatError = '';
        this.submited = true;
        this.connectionModel.default_project = this.connectionModel.billing_project;
        this.connectionModel.email = this.email;
        let response;
        if (!this.editing) {
          response = await this.$store.dispatch('connectors/createNewBQConnection', { ...this.serviceAccount, ...this.connectionModel });
        } else {
          response = await this.$store.dispatch('connectors/editBQConnection', { bqConnectionId: this.connection.id, ...this.serviceAccount, ...this.connectionModel });
        }
        this.submited = false;
        this.$emit('connectionSuccess', response.id);
      } catch (e) {
        const error = JSON.parse(e.message);
        this.submited = false;
        this.error = (error.status === 401 || error.status === 403) ? this.$t('ConnectorsPage.BigQuery.connection-error_401') : this.$t('ConnectorsPage.BigQuery.connection-error_internal');
        this.moreInfoError = error.message;
      }
    },
    async uploadServiceAccount () {
      if (!this.file) {
        return;
      }
      this.error = '';
      this.moreInfoError = '';
      this.formatError = '';
      const serviceAccount = await this.file.text();
      try {
        this.serviceAccount = JSON.parse(serviceAccount);
      } catch (e) {
        this.formatError = this.$t('ConnectorsPage.BigQuery.serviceAccountDadFormedError');
        return false;
      }

      try {
        this.projects = (await this.$store.dispatch('connectors/checkServiceAccount', serviceAccount)).map(p => ({ id: p.id, label: p.friendly_name }));
        this.connectionModel.billing_project = this.projects[0].id;
      } catch (e) {
        this.error = this.$t('ConnectorsPage.BigQuery.serviceAccountError');
        this.moreInfoError = e.message;
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
  width: 460px;
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
