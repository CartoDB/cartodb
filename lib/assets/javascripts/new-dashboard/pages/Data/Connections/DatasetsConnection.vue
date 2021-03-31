<template>
  <Dialog ref="dialog"
    :headerTitle="getHeaderTitleFromMode"
    :headerImage="require('../../../assets/icons/datasets/subsc-add-icon.svg')"
    :showSubHeader="true"
    :backRoute="{name: backNamedRoute}"
    :backText="null"
  >
    <template slot="sub-header">
      <h3 class="title is-caption is-regular is-txtMidGrey u-flex u-flex__align--center">
        <img height="21" class="u-mr--8" :src="logo">
        {{ $t('DataPage.connectWith') }} {{title}}
      </h3>
    </template>
    <template #default>
      <div  v-if="connector" class="u-flex u-flex__justify--center">
        <template v-if="isDatabase">
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
                <div class="is-small is-txtAlert error u-pr--12 u-pl--12 u-pb--8" v-if="error">
                  <div class="u-flex u-flex u-flex__align--center u-flex__justify--between error-header is-semibold">
                    <div class="text">
                      {{ $t('ConnectorsPage.queryError') }}
                    </div>
                    <div class="u-flex u-flex__align--center toggle" @click="openMoreInfo">
                      {{ $t('ConnectorsPage.queryErrorMoreInfo') }}
                      <span class="u-flex u-ml--8 chevron" :class="{ 'open': isErrorMessageOpen }"><img svg-inline src="../../../assets/icons/common/new-chevron.svg"/></span>
                    </div>
                  </div>
                  <div class="u-mt--16 text message" v-if="isErrorMessageOpen">
                    {{ errorMessage }}
                  </div>
                </div>
                <p v-if="isMySQL" class="text is-small is-txtSoftGrey u-mt--12">{{$t('DataPage.addConnector.sqlNoteMySQL')}}</p>
                <p v-else-if="isSQLServer" class="text is-small is-txtSoftGrey u-mt--12">{{$t('DataPage.addConnector.sqlNoteSQLServer')}}</p>
                <p v-else class="text is-small is-txtSoftGrey u-mt--12">{{$t('DataPage.addConnector.sqlNote')}}</p>
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
              <button @click="validateQuery" class="button is-primary" :disabled="!(query && datasetName) || sending">
                <span class="u-flex">
                  <img v-if="sending" svg-inline src="../../../assets/icons/common/loading.svg" class="u-mr--8 loading__svg"/>
                  {{sending ? $t('DataPage.addConnector.runningQuery'): $t('DataPage.addConnector.runQuery') }}
                </span>
              </button>
            </div>
          </div>
          <div v-else-if="queryIsValid" class="dataset-sync-card-container">
            <DatasetSyncCard
              :name="query"
              @inputChange="changeSyncInterval"
              fileType="SQL"
              isActive>
            </DatasetSyncCard>
          </div>
        </template>
        <template v-else>
          <div class="dataset-sync-card-container">
            <LoadingState size="40px" v-if="loadingFiles" primary />
            <template v-else>
              <div class="IntermediateInfo ServiceList-empty" v-if="!fileList || !fileList.length">
                <div class="LayoutIcon">
                  <i class="CDB-IconFont CDB-IconFont-lens"></i>
                </div>
                <h4 class="text is-caption is-txtMidGrey u-mt--8">
                  {{ $t('ConnectorsPage.oauthNoDataTitle') }}
                </h4>
                <p class="text is-small is-txtLightGrey u-mt--8">
                  {{ $t('ConnectorsPage.oauthNoDataSubtitle') }}
                </p>
              </div>
              <template v-else>
                <div class="text is-small is-txtMidGrey u-mb--24">
                  {{ $t('ConnectorsPage.itemList', {num: fileList.length, connector: title}) }}
                </div>
                <div v-for="file in fileList" :key="file.id" class="u-mb--12">
                  <DatasetSyncCard
                    :id="file.id"
                    :name="file.title"
                    :size="file.size"
                    :fileType="file.extension"
                    :isActive="selectedFile && file.id === selectedFile.id"
                    @inputChange="changeSyncInterval"
                    @click.native="chooseFile(file)">
                    </DatasetSyncCard>
                </div>
              </template>
            </template>
          </div>
        </template>
      </div>
    </template>
    <template v-if="queryIsValid || !isDatabase" slot="footer">
      <GuessPrivacyFooter
        :guess="uploadObject.content_guessing && uploadObject.type_guessing"
        :privacy="uploadObject.privacy"
        :disabled="!isDatabase ? !selectedFile : false"
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
import CodeBlock from 'new-dashboard/components/Code/CodeBlock.vue';
import LoadingState from 'new-dashboard/components/States/LoadingState';
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
    GuessPrivacyFooter,
    LoadingState
  },
  data () {
    return {
      query: '',
      datasetName: '',
      error: '',
      errorMessage: '',
      isErrorMessageOpen: false,
      connection: null,
      sending: false,
      queryIsValid: false,
      loadingFiles: true,
      fileList: null,
      selectedFile: null,
      uploadObject: this.getUploadObject(this.$store.state.user.account_type)
    };
  },
  props: {
    backNamedRoute: {
      default: ''
    },
    mode: String
  },
  async mounted () {
    const connId = this.$route.params.id;
    this.connection = await this.$store.dispatch('connectors/fetchConnectionById', connId);

    if (!this.isDatabase) {
      this.getOAuthFiles();
    }
  },
  computed: {
    isMySQL () {
      return this.connection.connector === 'mysql';
    },
    isSQLServer () {
      return this.connection.connector === 'sqlserver';
    },
    connector () {
      return this.connection ? getImportOption(this.connection.connector) : null;
    },
    placeholderQuery () {
      return this.connector && this.connector.options.placeholder_query;
    },
    isDatabase () {
      return this.connector && this.connector.type === 'database';
    },
    logo () {
      return this.connector && `${exportedScssVars.assetsDir.replace(/\"/g, '')}/images/layout/connectors/${this.connector.name}.svg`;
    },
    title () {
      return this.connector && this.connector.title;
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
        this.errorMessage = error.message;
      } finally {
        this.sending = false;
      }
    },
    async getOAuthFiles () {
      this.loadingFiles = true;
      try {
        const data = await this.$store.dispatch('connectors/fetchOAuthFileList', this.connection.connector);
        this.fileList = data.files.map(file => {
          const executed = /\.([0-9a-z]+)$/i.exec(file.filename);
          const extension = executed ? executed[1] : '?';
          return { ...file, extension };
        });
        this.loadingFiles = false;
      } catch (error) {
        const routeNamePrefix = this.$route.name.replace('connection-dataset', '');
        this.$router.push({ name: `${routeNamePrefix}connector-selected`, params: { connector: this.connector.options.service } });
      }
    },
    openMoreInfo () {
      this.isErrorMessageOpen = !this.isErrorMessageOpen;
    },
    chooseFile (file) {
      this.selectedFile = file;
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

      if (this.isDatabase) {
        this.uploadObject.connector = {
          connection_id: this.connection.id,
          sql_query: this.query,
          import_as: this.datasetName
        };
        this.uploadObject.value = this.query;
      } else {
        this.uploadObject.service_name = this.connector.options.service;
        this.uploadObject.service_item_id = this.selectedFile.id;
        this.uploadObject.value = this.selectedFile;
      }

      const backgroundPollingView = this.backboneViews.backgroundPollingView.getBackgroundPollingView();
      backgroundPollingView._addDataset({ ...this.uploadObject });
      this.$refs.dialog.closePopup();
    }
  }
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";

.loading__svg {
  height: 16px;
  width: 16px;
  outline: none;

  path {
    stroke: $blue--400;
    stroke-width: 2;
  }

  circle {
    stroke: $neutral--300;
    stroke-opacity: 1;
    stroke-width: 2;
  }
}

.forms-container {
  width: 620px;
  max-width: 100%;
}

h3.title {
  white-space: nowrap;
}

.query-container {
  flex-grow: 1;
  min-width: 0;

  .error {
    padding-top: 6px;
    border: 1px solid $red--400;
    background-color: transparentize($red--400, 0.92);
    border-top: 0;
    border-radius: 0 0 4px 4px;

    .chevron {

      &.open {
        transform: rotate(180deg);
      }

      svg {
        outline: none;

        path {
          fill: $red--400;;
        }
      }
    }
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
      padding: 8px 0;
      line-height: 18px;
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

.toggle {
  cursor: pointer;
}
</style>
