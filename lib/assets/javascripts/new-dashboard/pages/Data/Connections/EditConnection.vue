<template>
  <Dialog ref="dialog"
    :headerTitle="editing ? $t('ConnectorsPage.editConnection', {connector: title}) : $t('ConnectorsPage.addConnection')"
    :headerImage="connectionsSuccessfullId ?
      require('../../../assets/icons/datasets/conected.svg') :
      (editing ? require('../../../assets/icons/datasets/edit-connection.svg') : require('../../../assets/icons/datasets/add-connection.svg'))"
    :showSubHeader="!editing"
    :backRoute="{name: backNamedRoute}"
  >
    <template slot="sub-header">
      <h3 class="is-caption is-regular is-txtMidGrey u-flex u-flex__align--center" v-if="!editing">
        <img height="21" class="u-mr--8" :src="logo">
        {{ $t('DataPage.connectWith') }} {{title}}
      </h3>
    </template>
    <template #default>

      <template v-if="!connectionsSuccessfullId">
        <DatabaseConnectionForm
          v-if="type === 'database'"
          :connector="importOption"
          :connection="connection"
          :editing="editing"
          @connectClicked="databaseConnected"
        ></DatabaseConnectionForm>
      </template>

      <div v-else-if="connectionsSuccessfullId" class="connections-successfull u-flex u-flex__direction--column u-flex__align--center">
        <h3 class="is-semibold u-mt--16">{{ $t('DataPage.connectionsSuccessfull') }}</h3>
        <h4 class="is-caption u-mt--16 is-regular">{{$t('DataPage.imports.database.successTitle', { brand: title })}}</h4>
        <div class="u-mt--48 u-flex u-flex__align--center">
          <router-link :to="{ name: 'your-connections' }">
            <button class="is-small is-semibold is-txtPrimary">{{ $t('DataPage.imports.connections') }}</button>
          </router-link>
          <button @click="navigateNext" class="button is-primary u-ml--36">{{ $t('DataPage.addYourData') }}</button>
        </div>
      </div>

    </template>
  </Dialog>
</template>

<script>

import exportedScssVars from 'new-dashboard/styles/variables.scss';
import Dialog from 'new-dashboard/components/Dialogs/Dialog.vue';
import DatabaseConnectionForm from 'new-dashboard/components/Connector/DatabaseConnectionForm';
import { IMPORT_OPTIONS } from 'builder/components/modals/add-layer/content/imports/import-options';
import { mapState } from 'vuex';

export default {
  name: 'EditConnection',
  components: {
    Dialog,
    DatabaseConnectionForm
  },
  props: {
    backNamedRoute: {
      default: ''
    }
  },
  data () {
    return {
      editing: this.$route.name === 'edit-connection',
      connectionsSuccessfullId: false
    };
  },
  computed: {
    ...mapState({
      rawConnections: state => state.connectors.connections
    }),
    importOption () {
      let connector = this.editing ? 'postgres' : this.$route.params.connector;
      const option = Object.values(IMPORT_OPTIONS)
        .find(({ name, options }) => connector === name || connector === (options && options.service));
      return option;
    },
    connection () {
      return this.rawConnections && this.editing ? this.rawConnections.find(conn => conn.id === this.$route.params.id) : null;
    },
    logo () {
      return this.importOption && `${exportedScssVars.assetsDir.replace(/\"/g, '')}/images/layout/connectors/${this.importOption.name}.svg`;
    },
    title () {
      return this.importOption && this.importOption.title;
    },
    type () {
      return this.importOption && this.importOption.type;
    }
  },
  methods: {
    databaseConnected (id) {
      this.connectionsSuccessfullId = id;
    },
    navigateNext () {
      const routeNamePrefix = this.$route.name.replace('connector-selected', '');
      this.$router.push({ name: `${routeNamePrefix}connection-dataset`, params: { id: this.connectionsSuccessfullId } });
    }
  }
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";
.connections-successfull {
  h3 {
    font-size: 24px;
    line-height: 1.5;
  }
}
</style>
