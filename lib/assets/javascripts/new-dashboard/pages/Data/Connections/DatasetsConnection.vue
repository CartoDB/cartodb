<template>
  <Dialog ref="dialog"
    :headerTitle="$t('DataPage.addDataset')"
    :headerImage="require('../../../assets/icons/datasets/subsc-add-icon.svg')"
    :showSubHeader="true"
    :backRoute="{name: backNamedRoute}"
  >
    <template #default>
      <div class="u-flex u-flex__justify--center">
        <div v-if="!queryIsValid" class="forms-container">
          <h3 class="title is-small">{{$t('DataPage.addConnector.importFrom', { datasource: "Snowflake instance" })}}</h3>
          <div class="u-flex u-mt--24">
            <p class="text is-small u-mt--12 label-text">{{$t('DataPage.addConnector.query')}}</p>
            <div class="query-container u-ml--16">
              <div class="codeblock-container">
                <CodeBlock language="text/x-plsql"
                  :readOnly="false"
                  placeholder="SELECT *, ST_GeogPoint(longitude, latitude) AS the_geom FROM mytable"
                  v-model="query"/>
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
            <button @click="validateQuery" class="button is-primary" :disabled="!(query && datasetName)"> {{$t('DataPage.addConnector.runQuery')}} </button>
          </div>
        </div>
        <div v-else-if="queryIsValid" class="dataset-sync-card-container">
          <DatasetSyncCard
            :name="query"
            syncFrequency="never"
            fileType="SQL"
            isActive>
          </DatasetSyncCard>
        </div>
      </div>
    </template>
    <template v-if="queryIsValid" slot="footer">
      <GuessPrivacyFooter
        :disabled="false"
      ></GuessPrivacyFooter>
    </template>
  </Dialog>
</template>

<script>

import Dialog from 'new-dashboard/components/Dialogs/Dialog.vue';
import CodeBlock from 'new-dashboard/components/code/CodeBlock.vue';
import FormInput from 'new-dashboard/components/forms/FormInput';
import Button from 'new-dashboard/components/Button';
import DatasetSyncCard from 'new-dashboard/components/Connector/DatasetSyncCard';
import GuessPrivacyFooter from 'new-dashboard/components/Connector/GuessPrivacyFooter';

export default {
  name: 'DatasetsConnection',
  components: {
    Button,
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
      queryIsValid: false
    };
  },
  props: {
    backNamedRoute: {
      default: ''
    }
  },
  computed: {},
  methods: {
    validateQuery () {
      this.queryIsValid = true;
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

  .codeblock-container {
    height: 120px;
    overflow: hidden;
    border-radius: 4px;

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
