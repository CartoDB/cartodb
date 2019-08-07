<template>
  <section>
    <div class="appform__title">
      <router-link :to="{ name: 'oauth_apps_list' }">
        <img class="oauthapps__back" svg-inline src="new-dashboard/assets/icons/apps/back-arrow.svg" />
      </router-link>
      <h2 class="text is-small is-semibold u-ml--12">{{ $t(`OAuthAppsPage.form.newTitle`) }}</h2>
    </div>

    <FormComponent :oAuthApplication="app" :error="error" @submit="onSubmit">
      <div class="appform__toolbar">
        <div class="u-flex">
          <router-link :to="{ name: 'oauth_apps_list' }" class="button button--ghost u-mr--28">
            {{ $t(`OAuthAppsPage.form.cancelButton`) }}
          </router-link>

          <button class="button button--primary" type="submit" value="Submit">
            {{ $t(`OAuthAppsPage.form.saveButton`) }}
          </button>
        </div>
      </div>
    </FormComponent>

    <DeleteAppModal ref="deleteAppModal" :app="app"/>
    <RegenerateCredentialsModal ref="regenerateCredentialsModal" :app="app"/>
  </section>
</template>

<script>
import FormComponent from './FormComponent';
import DeleteAppModal from './modals/DeleteAppModal';
import RegenerateCredentialsModal from './modals/RegenerateCredentialsModal';

export default {
  name: 'CreateApp',
  components: {
    FormComponent,
    DeleteAppModal,
    RegenerateCredentialsModal
  },
  data () {
    return {
      app: {},
      error: {}
    };
  },
  methods: {
    onSubmit (app) {
      this.createApp(app);
    },
    createApp (app) {
      this.$store.dispatch('oAuthApps/create', app)
        .then(
          createdApp => {
            this.$router.push({name: 'oauth_app_edit', params: { id: createdApp.id }});
          },
          error => {
            this.error = error;
            window.scrollTo(0, 0);
          }
        );
    }
  }
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.appform__title {
  display: flex;
  align-items: center;
  justify-content: start;
  margin-bottom: 16px;
  padding-bottom: 28px;
  border-bottom: 1px solid $neutral--300;
}
</style>
