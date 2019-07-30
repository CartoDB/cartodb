<template>
  <Page class="page--settings">
    <div class="oauthapps grid">
      <SettingsSidebar class="grid-cell--col4" :userModel="user" :baseUrl="baseUrl" />

      <!-- Form -->
      <div class="oauthapps__container grid-cell--col8">
        <SettingsTabs></SettingsTabs>
        <router-view></router-view>
      </div>

    </div>

  </Page>
</template>

<script>
import Page from 'new-dashboard/components/Page';
import SettingsSidebar from 'new-dashboard/components/Apps/SettingsSidebar';
import SettingsTabs from 'new-dashboard/components/Apps/SettingsTabs';
import { mapState } from 'vuex';

export default {
  name: 'OauthApps',
  components: {
    Page,
    SettingsSidebar,
    SettingsTabs
  },
  computed: {
    ...mapState({
      user: state => state.user,
      baseUrl: state => state.user.base_url
    })
   }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.oauthapps {
  display: flex;
  width: 940px;
  min-height: 585px;
  margin: 20px auto 0;
  padding: 0;

  &__container {
    display: flex;
    flex-direction: column;
    width: 100%;
    padding-left: 82px;
  }
}

</style>
