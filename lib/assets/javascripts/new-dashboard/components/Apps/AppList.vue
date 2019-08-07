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
        <li v-for="oAuthApp in oAuthApps" :key="oAuthApp.id" class="apps__item">
          <div class="apps__icon u-mr--20">
            <img :src="oAuthApp.icon_url || require('../../assets/icons/apps/default.svg')">
          </div>

          <div class="apps__item-info">
            <span class="text is-small is-semibold apps__item-title">{{ oAuthApp.name }}</span>
            <span class="text is-small apps__item-description">{{ oAuthApp.description || 'No description provided' }}</span>
          </div>

          <router-link
            class="button button--outline button--edit"
            :to="{ name: 'oauth_app_edit', params: {id: oAuthApp.id } }">
            {{ $t('OAuthAppsPage.editButton') }}
          </router-link>
        </li>
      </ul>
    </div>

    <p class="text is-small u-mt--20" v-html="$t(`OAuthAppsPage.description`)"></p>
  </section>
</template>

<script>
import { mapState } from 'vuex';
import Spinner from '../Spinner';

export default {
  name: 'AppList',
  components: {
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

  &__item {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 28px 0;
    border-bottom: 1px solid $neutral--300;
  }

  &__item-info {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
  }

  &__item-title,
  &__item-description {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__item-title {
    line-height: 22px;
  }

  &__item-description {
    color: $neutral--600;
  }

  &__icon {
    display: flex;
    position: relative;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    border: 1px solid $neutral--300;
    border-radius: 2px;
  }
}

.button--edit {
  align-self: center;
  text-transform: uppercase;
}
</style>
