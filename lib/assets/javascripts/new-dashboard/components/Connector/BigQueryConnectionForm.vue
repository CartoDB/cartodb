<template>
  <div class="u-flex u-flex__justify--center">
    <div class="u-flex u-flex__align--center u-flex__direction--column">
      <div v-if="showDisclaimer">
        <h4 class="is-subtitle is-semibold u-mt--16">Lorem ipsum dolor sit</h4>
        <ul class="u-mt--16">
          <li class="u-mb--16">
            <span class="text is-caption">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas varius tortor nibh, sit amet tempor nibh finibus et.</span>
          </li>
          <li class="u-mb--16">
            <span class="text is-caption">Aenean eu enim justo. Vestibulum aliquam hendrerit molestie.</span>
          </li>
          <li class="u-mb--16">
            <span class="text is-caption">Maecenas tincidunt, velit ac porttitor pulvinar, tortor eros facilisis libero, vitae commodo nunc quam et ligula.</span>
          </li>
          <li class="u-mb--16">
            <span class="text is-caption">Ut nec ipsum sapien. Interdum et malesuada fames ac ante ipsum primis in faucibus.</span>
          </li>
        </ul>
        <div class="u-mt--48 u-flex u-flex__justify--center u-flex__align--center">
          <button @click="cancel" class="is-small is-semibold is-txtPrimary">{{$t('ConnectorsPage.BigQuery.conditions.cancel')}}</button>
          <button @click="accept" class="button is-primary u-ml--36">{{$t('ConnectorsPage.BigQuery.conditions.accept')}}</button>
        </div>
      </div>
      <div v-else-if="!showDisclaimer && !isFileSelected">
        <FileInput
          :label="$t('ConnectorsPage.BigQuery.fileInputLabel')"
          :supportedFormats="supportedFormats"
          @change="onFileChange"></FileInput>
      </div>
      <div v-else-if="!showDisclaimer && isFileSelected" class="u-flex u-flex__direction--column">
        <h4 class="is-small is-semibold">{{$t('ConnectorsPage.BigQuery.title')}}</h4>
        <div class="u-flex u-flex__justify--between u-flex__align--start u-mt--24 input-wrapper">
          <div class="u-flex u-flex__direction--column u-flex__align--end u-flex__grow--1  u-mr--16">
            <label class="is-small u-mt--12">{{$t('ConnectorsPage.BigQuery.connName')}}</label>
          </div>
          <input v-model="connectionModel.name" type="text" :placeholder="$t('DataPage.imports.database.placeholder-name')">
        </div>
        <div class="u-flex u-flex__justify--between u-flex__align--start u-mt--24 input-wrapper">
          <div class="u-flex u-flex__direction--column u-flex__align--end u-flex__grow--1  u-mr--16">
            <label class="is-small u-mt--12">{{$t('ConnectorsPage.BigQuery.billingProject')}}</label>
          </div>
          <div>
            <SelectComponent v-model="connectionModel.billing_project" :elements="projects"></SelectComponent>
            <div class="text is-small is-txtMidGrey u-mt--8 helper" :html="$t('ConnectorsPage.BigQuery.billingHelper')"></div>
          </div>
        </div>
        <div class="u-flex u-flex__align--center u-flex__justify--between u-mt--16 input-wrapper">
          <div class="u-flex u-flex__direction--column u-flex__align--end u-flex__grow--1  u-mr--16">
            <label class="is-small">{{$t('ConnectorsPage.BigQuery.defaultProject')}}</label>
          </div>
          <SelectComponent v-model="connectionModel.default_project" :elements="projects"></SelectComponent>
        </div>
        <div class="error-wrapper text is-small is-txtAlert u-flex u-flex__justify--start u-mt--16" v-if="error">
          {{ error }}
        </div>
        <div class="u-flex u-flex__justify--end u-mt--32">
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
      showDisclaimer: true,
      dragged: false,
      submited: false,
      projects: null,
      userAccount: null,
      serviceAccount: null,
      connectionModel: {
        name: '',
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
    connectionModelIsValid () {
      return this.connectionModel.name && this.connectionModel.billing_project && this.connectionModel.default_project;
    },
    isFileSelected () {
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
      this.uploadServiceAccount(file);
    },
    async connect () {
      try {
        this.error = '';
        this.submited = true;
        const response = await this.$store.dispatch('connectors/createNewBQConnection', { ...this.serviceAccount, ...this.connectionModel });
        this.submited = false;
        this.$emit('connectionSuccess', response.id);
      } catch (error) {
        this.submited = false;
        this.error = this.$t('DataPage.imports.database.connection-error');
      }
    },
    async uploadServiceAccount (file) {
      const serviceAccount = await file.text();
      this.serviceAccount = JSON.parse(serviceAccount);

      try {
        this.error = '';
        this.projects = (await this.$store.dispatch('connectors/checkServiceAccount', serviceAccount)).map(p => ({ id: p.id, label: p.friendly_name }));
      } catch (e) {
        this.error = this.$t('ConnectorsPage.BigQuery.serviceAccountError');
      }
    }
  }
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";

ul {
  max-width: 588px;
  list-style: disc;

  li {
    font-size: 12px;
  }
}

.helper {
  max-width: 512px;
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
