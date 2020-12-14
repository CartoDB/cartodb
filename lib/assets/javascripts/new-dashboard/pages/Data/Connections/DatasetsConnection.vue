<template>
  <Dialog ref="dialog"
    :headerTitle="$t('DataPage.addDataset')"
    :headerImage="require('../../../assets/icons/datasets/subsc-add-icon.svg')"
    :showSubHeader="true"
    :backRoute="{name: backNamedRoute}"
  >
    <template #default>
      <div  v-if="connector" class="u-flex u-flex__justify--center">
        <div v-if="!queryIsValid" class="forms-container">
          <h3 class="title is-small">{{$t('DataPage.addConnector.importFrom', { datasource: connector.title })}}</h3>
          <div class="u-flex u-mt--24">
            <p class="text is-small u-mt--12 label-text">{{$t('DataPage.addConnector.query')}}</p>
            <div class="query-container u-ml--16">
              <div class="codeblock-container" :class="{ 'with-errors': error}">
                <CodeBlock language="text/x-plsql"
                  :readOnly="false"
                  :placeholder="placeholderQuery"
                  v-model="query"/>
              </div>
              <div class="text is-small is-txtAlert error u-pt--10 u-pr--12 u-pl--12 u-pb--8" v-if="error">
                {{ $t('ConnectorsPage.queryError') }}
              </div>
              <p class="text is-small is-txtSoftGrey u-mt--12">{{$t('DataPage.addConnector.sqlNote')}}</p>
            </div>
          </div>
          <div class="u-flex u-mt--20">
            <p class="text is-small u-mt--24 label-text">{{$t('DataPage.addConnector.destinationDataset')}}</p>
            <div class="dataset-container u-ml--16">
              <FormInput
                :optional="true"
                placeholder=""
                v-model="datasetName"/>
              <p class="text is-small is-txtSoftGrey u-mt--12">{{$t('DataPage.addConnector.destinationDatasetNote')}}</p>
            </div>
          </div>
          <div class="u-flex u-flex__justify--end u-mt--24">
            <button @click="validateQuery" class="button is-primary" :disabled="!(query && datasetName) || sending"> {{$t('DataPage.addConnector.runQuery')}} </button>
          </div>
        </div>
        <div v-else-if="queryIsValid" class="dataset-sync-card-container">
          <DatasetSyncCard
            :name="query"
            @inputChange="changeSyncInterval"
            syncFrequency="never"
            fileType="SQL"
            isActive>
          </DatasetSyncCard>
        </div>
      </div>
    </template>
    <template v-if="queryIsValid" slot="footer">
      <GuessPrivacyFooter
        :guess="uploadObject.content_guessing && uploadObject.type_guessing"
        :privacy="uploadObject.privacy"
        :disabled="false"
        @guessChanged="changeGuess"
        @privacyChanged="changePrivacy"
        @connect="connectDataset"
      ></GuessPrivacyFooter>
    </template>
  </Dialog>
</template>

<script>

import Dialog from 'new-dashboard/components/Dialogs/Dialog.vue';
import CodeBlock from 'new-dashboard/components/code/CodeBlock.vue';
import FormInput from 'new-dashboard/components/forms/FormInput';
import DatasetSyncCard from 'new-dashboard/components/Connector/DatasetSyncCard';
import GuessPrivacyFooter from 'new-dashboard/components/Connector/GuessPrivacyFooter';
import { getImportOption } from 'new-dashboard/utils/connector/import-option';
import uploadData from 'new-dashboard/mixins/connector/uploadData';

export default {
  name: 'DatasetsConnection',
  inject: ['backboneViews'],
  mixins: [uploadData],
  components: {
    CodeBlock,
    Dialog,
    FormInput,
    DatasetSyncCard,
    GuessPrivacyFooter
  },
  data () {
    return {
      query: '',
      datasetName: '',
      error: '',
      connection: null,
      sending: false,
      queryIsValid: false,
      uploadObject: this.getUploadObject()
    };
  },
  props: {
    backNamedRoute: {
      default: ''
    }
  },
  async mounted () {
    const connId = this.$route.params.id;
    this.connection = await this.$store.dispatch('connectors/fetchConnectionById', connId);
  },
  computed: {
    connector () {
      return this.connection ? getImportOption(this.connection.connector) : null;
    },
    placeholderQuery () {
      return this.connector && this.connector.options.placeholder_query;
    }
  },
  methods: {
    async validateQuery () {
      this.sending = true;
      this.error = '';

      try {
        await this.$store.dispatch('connectors/connectionDryrun', { ...this.connection, sql_query: this.query, import_as: this.datasetName });
        this.queryIsValid = true;
      } catch (error) {
        this.error = true;
      } finally {
        this.sending = false;
      }
    },
    changeSyncInterval (value) {
      this.uploadObject.interval = value;
    },
    changeGuess (value) {
      this.uploadObject.content_guessing = value;
      this.uploadObject.type_guessing = value;
    },
    changePrivacy (value) {
      this.uploadObject.privacy = value;
    },
    connectDataset () {
      this.uploadObject.type = 'service';
      this.uploadObject.connector = {
        connection_id: this.connection.id,
        sql_query: this.query,
        import_as: this.datasetName
      };

      const backgroundPollingView = this.backboneViews.backgroundPollingView.getBackgroundPollingView();
      backgroundPollingView._addDataset({ ...this.uploadObject, value: this.query });
      this.$refs.dialog.closePoup();
    }
  }
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";

.forms-container {
  width: 620px;
  max-width: 100%;
}

.query-container {
  flex-grow: 1;
  min-width: 0;

  .error {
    border: 1px solid $red--400;
    background-color: transparentize($red--400, 0.92);
    border-top: 0;
    border-radius: 0 0 4px 4px;
  }

  .codeblock-container {
    height: 120px;
    overflow: hidden;
    border-radius: 4px;

    &.with-errors {
      border-radius: 4px 4px 0 0;
    }

    /deep/ .CodeMirror {
      max-width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
    }
  }
}

.label-text {
  flex-shrink: 0;
  width: 90px;
  text-align: right;
}

.dataset-container {
  flex-grow: 1;
}

.dataset-sync-card-container {
  max-width: 780px;
}
</style>
