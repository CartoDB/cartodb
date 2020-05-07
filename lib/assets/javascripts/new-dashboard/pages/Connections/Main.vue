<template>
  <Page class="page--settings">
    <section class="connections grid">
      <SettingsSidebar class="grid-cell--col4" :userModel="user" :baseUrl="baseUrl" />

      <div class="grid-cell--col8">
        <h1 class="page__title">{{ $t('Connections.sections.directSQLConnection') }}</h1>
        <DBConnection />
      </div>
    </section>
  </Page>
</template>

<script>
import { mapState } from 'vuex';
import Page from 'new-dashboard/components/Page';
import DBConnection from './DBConnection/DBConnection.vue';
import SettingsSidebar from 'new-dashboard/components/Apps/SettingsSidebar';

export default {
  name: 'ConnectionsPage',
  components: {
    Page,
    DBConnection,
    SettingsSidebar
  },
  computed: {
    ...mapState({
      user: state => state.user,
      baseUrl: state => state.user.base_url
    })
  }
};
</script>

<style lang="scss" scoped>
.page__title {
  font-size: 18px;
  font-family: 'Open Sans', sans-serif;
  border-bottom: 1px solid rgba(0, 0, 0,0.1);
  padding-bottom: 26px;
  margin-bottom: 20px;
}

.connections {
  display: flex;
  width: 940px;
  min-height: 585px;
  margin: 48px auto 0;
}
</style>
