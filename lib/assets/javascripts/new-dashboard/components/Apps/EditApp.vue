<template>
  <section>
    <div class="appform__title">
      <router-link :to="{ name: 'oauth_apps_list' }">
        <img class="oauthapps__back" svg-inline src="../../assets/icons/apps/back-arrow.svg" />
      </router-link>

      <h2 class="text is-small is-semibold u-ml--12">
        {{ $t(`OAuthAppsPage.form.editTitle`)}}
      </h2>
    </div>

    <Spinner v-if="isFetchingOAuthApps" class="apps__spinner"/>

    <section class="appform__content" v-if="!isFetchingOAuthApps">
      <div class="u-mb--64">
        <div class="u-mb--16">
          <span class="appform__label">{{ $t(`OAuthAppsPage.form.ownedby`) }}</span>&nbsp;
          <span class="text is-small">{{ app.username }}</span>
        </div>

        <div class="u-mb--16">
          <span class="appform__label">{{ $t(`OAuthAppsPage.form.clientId`) }}</span>&nbsp;
          <span class="text is-small">{{ app.client_id }}</span>
        </div>

        <div class="u-mb--16">
          <span class="appform__label">{{ $t(`OAuthAppsPage.form.clientSecret`) }}</span>&nbsp;
          <span class="text is-small">{{ app.client_secret }}</span>
        </div>

        <div class="u-flex u-mb--24">
          <img src="../../assets/icons/apps/warning.svg" />
          <span class="text is-small is-txtSoftGrey u-ml--8">{{ $t(`OAuthAppsPage.form.clientSecretWarning`) }}</span>
        </div>

        <button class="button button--outline u-mb--24" @click="openRegenerateCredentialsModal">
          {{ $t(`OAuthAppsPage.form.clientSecretButton`) }}
        </button>

        <span class="text is-small is-txtSoftGrey" v-html="$t(`OAuthAppsPage.form.clientSecretDesc`)"></span>
      </div>

      <div ref="formScroll" class="appform__title u-mb--24">
        <h2 class="text is-caption">{{ $t(`OAuthAppsPage.form.appInformationTitle`) }}</h2>
      </div>

      <FormComponent
        v-if="!isFetchingOAuthApps"
        :oAuthApplication="app"
        :formTitle="$t(`OAuthAppsPage.form.editTitle`)"
        :error="error"
        @submit="onSubmit">
        <div class="appform__toolbar u-flex__justify--between">
          <button type="button" class="button button--outline button--delete u-mr--48" @click="openDeleteAppModal">
            {{ $t(`OAuthAppsPage.form.deleteAppButton`) }}
          </button>

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
    </section>

    <DeleteAppModal ref="deleteAppModal" :app="app"/>
    <RegenerateCredentialsModal ref="regenerateCredentialsModal" :app="app"/>
  </section>
</template>

<script>
import { mapState } from 'vuex';
import FormComponent from './FormComponent';
import Spinner from '../Spinner';
import DeleteAppModal from './modals/DeleteAppModal';
import RegenerateCredentialsModal from './modals/RegenerateCredentialsModal';

export default {
  name: 'EditApp',
  components: {
    FormComponent,
    DeleteAppModal,
    RegenerateCredentialsModal,
    Spinner
  },
  data () {
    return {
      error: {}
    };
  },
  computed: {
    ...mapState({
      list: state => state.oAuthApps.list,
      isFetchingOAuthApps: state => state.oAuthApps.isFetching,
      app (state) {
        if (this.isFetchingOAuthApps) {
          return {};
        }

        return this.list[this.$route.params.id];
      }
    })
  },
  methods: {
    onSubmit (app) {
      return this.updateApp(app);
    },
    updateApp (app) {
      this.$store.dispatch('oAuthApps/update', app)
        .then(
          () => this.$router.push({ name: 'oauth_apps_list' }),
          (error) => {
            this.error = error;
            window.scrollTo(0, this.$refs.formScroll.offsetTop);
          }
        );
    },
    deleteApp () {
      this.$store.dispatch('oAuthApps/delete', this.app)
        .then(
          () => this.$router.push({ name: 'oauth_apps_list' })
        );
    },
    openDeleteAppModal () {
      this.$refs.deleteAppModal.open();
    },
    openRegenerateCredentialsModal () {
      this.$refs.regenerateCredentialsModal.open();
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

.appform_spinner {
  margin: 120px auto;
}

.appform__label {
  margin-bottom: 8px;
  font-family: 'Open Sans', sans-serif;
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;

  &--optional {
    font-weight: 400;
  }
}

.appform__toolbar {
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  width: 100%;
  height: 70px;
  border-top: 1px solid $neutral--400;
}

.button--delete {
  border: 1px solid $red--600;
  color: $red--600;
}
</style>
