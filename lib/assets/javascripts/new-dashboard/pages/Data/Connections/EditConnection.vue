<template>
  <Dialog ref="dialog"
    :headerTitle="connectionsSuccessfulId ?
      $t('ConnectorsPage.successConnection') :
      (editing ? $t('ConnectorsPage.editConnection', {connector: title}) : $t('ConnectorsPage.addConnection'))"
    :headerImage="connectionsSuccessfulId ?
      require('../../../assets/icons/datasets/conected.svg') :
      (editing ? require('../../../assets/icons/datasets/edit-connection.svg') : require('../../../assets/icons/datasets/add-connection.svg'))"
    :showSubHeader="!editing && !connectionsSuccessfulId"
    :backRoute="{name: backNamedRoute}"
  >
    <template slot="sub-header">
      <h3 class="title is-caption is-regular is-txtMidGrey u-flex u-flex__align--center" v-if="!editing">
        <img height="21" class="u-mr--8" :src="logo">
        {{ $t('DataPage.connectWith') }} {{title}}
      </h3>
    </template>
    <template #default>

      <template v-if="!connectionsSuccessfulId">
        <DatabaseConnectionForm v-if="type === 'database' && !isBigQuery"
          :connector="importOption"
          :connection="connection"
          @connectClicked="connectionSuccess" @cancel="onCancel"></DatabaseConnectionForm>
        <BigQuerySelectionMode v-else-if="isBigQuery"
          :connection="connection" @cancel="onCancel" @connectionSuccess="connectionSuccess"></BigQuerySelectionMode>
        <OAuthConnectionForm v-else-if="type === 'cloud'"
          :connector="importOption"
          :connection="connection" @connectionSuccess="connectionSuccess"></OAuthConnectionForm>
      </template>

      <div v-else-if="connectionsSuccessfulId" class="connections-successfull u-flex u-flex__direction--column u-flex__align--center">
        <h3 class="is-semibold u-mt--16">{{ $t('DataPage.connectionsSuccessfull') }}</h3>
        <h4 class="is-caption u-mt--16 is-regular">{{$t('DataPage.imports.database.successTitle', { brand: title })}}</h4>
        <div class="u-mt--48 u-flex u-flex__align--center">
          <button @click="onCancel" class="button is-primary">{{ $t('Dialogs.finish') }}</button>
          <!-- <router-link :to="{ name: 'your-connections' }">
            <button class="is-small is-semibold is-txtPrimary">{{ $t('DataPage.imports.connections') }}</button>
          </router-link>
          <router-link v-if="isBigQuery" :to="{ name: 'tilesets' }">
            <button class="u-ml--36 is-small is-semibold is-txtPrimary">{{$t('DataPage.tilesets')}}</button>
          </router-link>
          <button @click="navigateNext" class="button is-primary u-ml--36">{{ $t('DataPage.addYourData') }}</button> -->
        </div>
      </div>
    </template>
  </Dialog>
</template>

<script>

import exportedScssVars from 'new-dashboard/styles/helpers/_assetsDir.scss';
import Dialog from 'new-dashboard/components/Dialogs/Dialog.vue';
import { getImportOption } from 'new-dashboard/utils/connector/import-option';
import BigQuerySelectionMode from 'new-dashboard/components/Connector/BigQuerySelectionMode';
import OAuthConnectionForm from 'new-dashboard/components/Connector/OAuthConnectionForm';
import DatabaseConnectionForm from 'new-dashboard/components/Connector/DatabaseConnectionForm';
import { mapState } from 'vuex';

export default {
  name: 'EditConnection',
  components: {
    Dialog,
    DatabaseConnectionForm,
    OAuthConnectionForm,
    BigQuerySelectionMode
  },
  props: {
    backNamedRoute: {
      default: ''
    }
  },
  data () {
    return {
      connectionsSuccessfulId: null
    };
  },
  computed: {
    ...mapState({
      rawConnections: state => state.connectors.connections
    }),
    isBigQuery () {
      return this.importOption && this.importOption.options && this.importOption.options.service === 'bigquery';
    },
    importOption () {
      let connector = this.editing ? (this.connection ? this.connection.connector : null) : this.$route.params.connector;
      const option = getImportOption(connector);
      return option;
    },
    editing () {
      return this.$route.name === 'edit-connection';
    },
    connection () {
      return this.rawConnections && this.editing ? this.rawConnections.find(conn => conn.id === this.$route.params.id) : null;
    },
    logo () {
      return this.importOption && `${exportedScssVars.assetsDir && exportedScssVars.assetsDir.replace(/\"/g, '')}/images/layout/connectors/${this.importOption.name}.svg`;
    },
    title () {
      return this.importOption && this.importOption.title;
    },
    type () {
      return this.importOption && this.importOption.type;
    }
  },
  methods: {
    connectionSuccess (id) {
      this.connectionsSuccessfulId = id;
      this.$store.dispatch('connectors/fetchConnectionsList');
    },
    onCancel () {
      this.$refs.dialog.closePopup();
    },
    navigateNext () {
      const routeNamePrefix = !this.editing ? this.$route.name.replace('connector-selected', '') : 'new-connection-';
      this.$router.push({ name: `${routeNamePrefix}connection-dataset`, params: { id: this.connectionsSuccessfulId } });
    }
  }
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";
h3.title {
  white-space: nowrap;
}
.connections-successfull {
  h3 {
    font-size: 24px;
    line-height: 1.5;
  }
}
</style>
