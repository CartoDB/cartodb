<template>
  <section class="apps">
    <div class="apps__title">
      <h2 class="text is-small is-semibold">{{ $t(`OAuthAppsPage.title`) }}</h2>

      <router-link class="button button--small" :to="{ name: 'oauth_app_new' }">
        {{ $t(`OAuthAppsPage.newAppButton`) }}
      </router-link>
    </div>

    <Spinner v-if="isFetchingApps" class="apps__spinner"/>

    <p v-if="!isFetchingApps && !hasOAuthApps" v-html="$t(`OAuthAppsPage.emptyDescription`)" class="text is-caption u-mt--32"></p>
    <div v-else class="apps__list">
      <ul>
        <AppElement v-for="oAuthApp in oAuthApps" :key="oAuthApp.id" :oAuthApp="oAuthApp">
          <router-link
            class="button button--outline button--edit"
            :to="{ name: 'oauth_app_edit', params: {id: oAuthApp.id } }">
            {{ $t('OAuthAppsPage.editButton') }}
          </router-link>
        </AppElement>
      </ul>
    </div>

    <p class="text is-small u-mt--20" v-html="$t(`OAuthAppsPage.description`)"></p>
  </section>
</template>

<script>
import { mapState } from 'vuex';
import AppElement from './AppElement';
import Spinner from '../Spinner';

export default {
  name: 'AppList',
  components: {
    AppElement,
    Spinner
  },
  computed: {
    ...mapState({
      isFetchingApps: state => state.oAuthApps.isFetching,
      oAuthApps: state => state.oAuthApps.list,
      error: state => state.oAuthApps.error,
      hasOAuthApps: state => !state.oAuthApps.isFetching && !!Object.keys(state.oAuthApps.list).length
    })
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.apps {
  &__spinner {
    margin: 120px auto;
  }

  &__title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 16px;
    border-bottom: 1px solid $neutral--300;
  }
}

.button--edit {
  align-self: center;
  text-transform: uppercase;
}
</style>
