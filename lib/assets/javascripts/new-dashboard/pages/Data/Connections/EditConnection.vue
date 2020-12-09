<template>
  <Dialog ref="dialog"
    :headerTitle="$t('DataPage.addConnection')"
    :headerImage=" connectionsSuccessfull ? require('../../../assets/icons/datasets/conected.svg') : require('../../../assets/icons/datasets/add-connection.svg')"
    :backRoute="{name: backNamedRoute}"
  >
    <template slot="sub-header">
      <h3 class="is-caption is-regular is-txtMidGrey u-flex u-flex__align--center">
        <img height="21" class="u-mr--8" :src="logo">
        {{ $t('DataPage.connectWith') }} {{title}}
      </h3>
    </template>
    <template #default>

      <template v-if="!connectionsSuccessfull">
      <DatabaseConnectionForm
          v-if="type === 'database'"
          :connector="importOption"
          @connectClicked="connectDatabase"
        ></DatabaseConnectionForm>
      </template>

      <div v-else-if="connectionsSuccessfull" class="connections-successfull u-flex u-flex__direction--column u-flex__align--center">
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
      connectionsSuccessfull: false
    };
  },
  computed: {
    importOption () {
      const option = Object.keys(IMPORT_OPTIONS).find(opt => IMPORT_OPTIONS[opt].name === this.$route.params.connector);
      return option && IMPORT_OPTIONS[option];
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
    connectDatabase (params) {
      this.connectionsSuccessfull = true;
    },
    navigateNext () {
      const routeNamePrefix = this.$route.name.replace('new-connection-connector', '');
      this.$router.push({name: `${routeNamePrefix}connection-dataset`, params: {id: 1}});
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
