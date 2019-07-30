<template>
  <div>
    <div class="applist__title">
      <h2 class="text is-small is-semibold">{{ $t(`OauthAppsPage.title`) }}</h2>
      <router-link :to="{ name: 'oauth_app_new' }">
        <button class="applist__button">{{ $t(`OauthAppsPage.newAppButton`) }}</button>
      </router-link >
    </div>
    <p v-if="!hasConnectedApps" v-html="$t(`OauthAppsPage.emptyDescription`)" class="text is-caption"></p>
    <div v-else class="applist__list">
      <ul>
        <li v-for="connectedApp in connectedApps" :key="connectedApp.id" class="applist__item">
          <div class="applist__icon u-mr--20">
            <img svg-inline src="../../assets/icons/apps/default.svg">
          </div>
          <div class="applist__item-info">
            <span class="text is-small is-semibold applist__item-title">{{ connectedApp.name }}</span>
            <span class="text is-small applist__item-description">{{ connectedApp.description }}</span>
          </div>
          <router-link :to="{ name: 'oauth_app_edit', params: {id: connectedApp.id } }" class="applist__button applist__button--edit">
            {{ $t(`OauthAppsPage.editButton`) }}
          </router-link>
        </li>
      </ul>
    </div>
    <p class="text is-small u-mt--32" v-html="$t(`OauthAppsPage.description`)"></p>
  </div>
</template>

<script>
import { mapState } from 'vuex';

export default {
  name: 'AppList',
  data () {
    return {
      selectedApp: {}
    };
  },
  computed: {
    ...mapState({
      isFetchingApps: state => state.apps.isFetching,
      connectedApps: state => state.apps.connectedApps,
      error: state => state.apps.error,
      hasConnectedApps: state => !state.apps.isFetchingApps && state.apps.connectedApps
    })
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.applist {
  &__title {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    padding-bottom: 28px;
    border-bottom: 1px solid $neutral--300;
  }

  &__list {
    margin-top: 36px;
  }

  &__item {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 20px 0;
    border-bottom: 1px solid $neutral--300;
  }

  &__item-info {
    display: flex;
    flex-grow: 1;
  }

  &__item-title {
    max-width: 356px;
    line-height: 22px;
  }

  &__item-description {
    max-width: 356px;
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

  &__button {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px 12px;
    border-radius: 4px;
    background-color: $color-primary;
    color: $white;
    font-family: 'Open Sans', sans-serif;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0;
    text-transform: uppercase;
    cursor: pointer;

    &--edit {
      border: 1px solid $color-primary;
      background-color: transparent;
      color: $color-primary;
      font-size: 12px;
    }

    &:hover,
    &:focus {
      text-decoration: underline;
    }
  }
}
</style>
