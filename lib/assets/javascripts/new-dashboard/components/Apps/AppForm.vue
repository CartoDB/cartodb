<template>
  <div>
    <div class="appform__title">
      <router-link :to="{ name: 'oauth_apps_list' }">
        <img class="oauthapps__back" svg-inline src="../../assets/icons/apps/back-arrow.svg" />
      </router-link>
      <h2 class="text is-small is-semibold u-ml--12">{{ formTitle }}</h2>
    </div>

    <div v-if="isEditMode" class="u-mb--64">
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
      <button class="appform__button appform__button--regenerate u-mb--24" @click="openRegenerateAppModal">{{ $t(`OAuthAppsPage.form.clientSecretButton`) }}</button>
      <span class="text is-small is-txtSoftGrey" v-html="$t(`OAuthAppsPage.form.clientSecretDesc`)"></span>
    </div>

    <div ref="formScroll" v-if="isEditMode" class="appform__title u-mb--24">
      <h2 class="text is-caption">{{ $t(`OAuthAppsPage.form.appInformationTitle`) }}</h2>
    </div>

    <div>
      <form id="app" @submit="checkForm" v-if="(!isEditMode || !isFetchingOAuthApps)">
          <div class="appform__block">
            <label class="appform__label" for="app.name">{{ $t(`OAuthAppsPage.form.appName`) }}</label>
            <input class="appform__input" :class="{'has-error': !!error.name}" type="text" name="app.name" id="app.name" v-model="app.name">
            <span class="appform__input-desc">{{ $t(`OAuthAppsPage.form.appNameDesc`) }}</span>
            <span v-if="error.name" class="appform__error">{{ $t(`OAuthAppsPage.form.appName`) }}&nbsp;{{error.name}}</span>
          </div>

          <div class="appform__block">
            <label class="appform__label" for="app.website">{{ $t(`OAuthAppsPage.form.webUrl`) }}</label>
            <input class="appform__input" type="text" name="app.website" id="app.website" v-model="app.website">
            <span class="appform__input-desc">{{ $t(`OAuthAppsPage.form.webUrlDesc`) }}</span>
          </div>

          <div class="appform__block">
            <label class="appform__label" for="app.description">{{ $t(`OAuthAppsPage.form.description`) }}<span class="appform__label--optional">&nbsp;{{ $t(`OAuthAppsPage.form.optional`) }}</span></label>
            <textarea class="appform__input appform__input--textarea" type="text" name="app.description" id="app.description" v-model="app.description"></textarea>
            <span class="appform__input-desc" v-html="$t(`OAuthAppsPage.form.descriptionDesc`)"></span>
          </div>

          <div class="appform__block">
            <label class="appform__label" for="appCallbacks">{{ $t(`OAuthAppsPage.form.callbackUrls`) }}</label>
            <ul>
              <li v-for="(callbackUrl, k) in editedCallbacks" :key="k">
                <input class="appform__input" :class="{'has-error': !!error.redirect_uris}" type="text" name="callbackUrl" id="callbackUrl" v-model="callbackUrl.name" :placeholder="$t(`OAuthAppsPage.form.callbackUrlPlaceholder`)">
                <span v-show="showDelete(k, editedCallbacks)" class="appform__link u-ml--16 appform__link--delete" @click="removeCallbackUrl(k)">{{ $t(`OAuthAppsPage.form.callbackUrlDelete`) }}</span>
                <span v-show="k == editedCallbacks.length-1" class="appform__link u-ml--16" @click="addCallbackUrl(k)">{{ $t(`OAuthAppsPage.form.callbackUrlAddMore`) }}</span>
              </li>
            </ul>
            <span v-if="!!error.redirect_uris" class="appform__error">{{ $t(`OAuthAppsPage.form.callbackUrls`) }}&nbsp;{{error.redirect_uris}}</span>

            <span class="appform__input-desc" v-html="$t(`OAuthAppsPage.form.callbackUrlsDesc`)"></span>
          </div>

          <div class="appform__block">
            <label class="appform__label" for="app.logoUrl">{{ $t(`OAuthAppsPage.form.logoUpload`) }}<span class="appform__label--optional">&nbsp;{{ $t(`OAuthAppsPage.form.optional`) }}</span></label>
            <div class="appform__block u-flex__direction--row">
              <div class="appform__logo" :class="{'has-error': !!logo.error.length}">
                <img v-if="logo.isFetching" svg-inline src="../../assets/icons/apps/spinner.svg">
                <img class="appform__logo-image" :class="{'is-hidden': logo.isFetching}" ref="displayLogo" :src="displayLogo">
              </div>
              <div class="appform__block--file">
                <input type="file" class="appform__input--file" @change="changeLogo" accept="image/jpeg,image/jpg,image/png,image/gif">
                <span class="appform__link">{{ $t(`OAuthAppsPage.form.logoUploadLink`) }}</span>
                <span v-if="!!logo.error.length" class="appform__error u-mt--4">{{logo.error}}</span>
                <span v-else class="appform__input-desc appform__input-desc--12" v-html="$t(`OAuthAppsPage.form.logoUploadDesc`)"></span>
                <input hidden type="text" name="logoUrl" id="logoUrl" v-model="app.logoUrl">
              </div>
            </div>
          </div>

          <div class="appform__toolbar"  :class="{'u-flex__justify--between': isEditMode}">
            <button v-if="isEditMode" class="appform__button appform__button--delete u-mr--48" @click="openDeleteAppModal">{{ $t(`OAuthAppsPage.form.deleteAppButton`) }}</button>
            <div class="u-flex">
              <router-link :to="{ name: 'oauth_apps_list' }" class="appform__button appform__button--cancel u-mr--28">
                {{ $t(`OAuthAppsPage.form.cancelButton`) }}
              </router-link>
              <button class="appform__button" type="submit" value="Submit">{{ $t(`OAuthAppsPage.form.saveButton`) }}</button>
            </div>
          </div>
        </form>
      </div>

      <!-- Delete Modal -->
      <Modal :isOpen="isDeleteModalOpen" name="DeleteApp">
        <div class="oauthapps__modal">
          <div class="oauthapps__modal-inner">
            <div class="oauthapps__icon u-mb--24">
              <img svg-inline src="../../assets/icons/apps/default.svg">
              <img class="oauthapps__badge" svg-inline src="../../assets/icons/apps/trash.svg">
            </div>
            <span class="text is-caption u-mb--8" v-html="$t(`OAuthAppsPage.deleteModal.title`, { name: app.name })"></span>
            <span class="text is-small is-txtSoftGrey" v-html="$t(`OAuthAppsPage.deleteModal.subtitle`)"></span>
            <div class="oauthapps__modal-actions">
              <button class="oauthapps__modal-button u-mr--12" @click="closeModal">{{ $t(`OAuthAppsPage.deleteModal.cancelButton`) }}</button>
              <button class="oauthapps__modal-button oauthapps__modal-button--delete" @click="deleteApp">{{ $t(`OAuthAppsPage.deleteModal.deleteButton`) }}</button>
            </div>
          </div>
        </div>
      </Modal>

      <!-- Regenerate Modal -->
      <Modal :isOpen="isRegenerateModalOpen" name="RegenerateClientSecret">
        <div class="oauthapps__modal">
          <div class="oauthapps__modal-inner">
            <div class="oauthapps__icon u-mb--24">
              <img svg-inline src="../../assets/icons/apps/default.svg">
              <img class="oauthapps__badge" svg-inline src="../../assets/icons/apps/key.svg">
            </div>
            <span class="text is-caption u-mb--8" v-html="$t(`OAuthAppsPage.regenerateModal.title`, { name: app.name })"></span>
            <span class="text is-small is-txtSoftGrey" v-html="$t(`OAuthAppsPage.regenerateModal.subtitle`)"></span>
            <div class="oauthapps__modal-actions">
              <button class="oauthapps__modal-button u-mr--12" @click="closeModal">{{ $t(`OAuthAppsPage.regenerateModal.cancelButton`) }}</button>
              <button class="oauthapps__modal-button oauthapps__modal-button--regenerate" @click="regenerateClientSecret">{{ $t(`OAuthAppsPage.regenerateModal.regenerateButton`) }}</button>
            </div>
          </div>
        </div>
      </Modal>
  </div>
</template>

<script>
import { mapState } from 'vuex';
import Modal from 'new-dashboard/components/Modal';

export default {
  name: 'AppForm',
  components: {
    Modal
  },
  data () {
    return {
      defaultLogoPath: require('../../assets/icons/apps/logo-default.svg'),
      isDeleteModalOpen: false,
      isRegenerateModalOpen: false,
      editedCallbacks: [{ name: '' }],
      error: {},
      logo: {
        error: [],
        isFetching: false
      }
    };
  },
  computed: {
    ...mapState({
      isFetchingOAuthApps: state => state.oAuthApps.isFetching,
      oAuthApps: state => state.oAuthApps.list,
      isEditMode () {
        return this.$route.name === 'oauth_app_edit';
      },
      formTitle () {
        return this.isEditMode ? this.$t(`OAuthAppsPage.form.editTitle`) : this.$t(`OAuthAppsPage.form.newTitle`);
      },
      displayLogo () {
        return this.app.icon_url || this.defaultLogoPath;
      },
      app () {
        if (!this.isEditMode || this.isFetchingOAuthApps) {
          return {};
        }
        const selectedApp = this.oAuthApps[this.$route.params.id];
        this.editedCallbacks = this.redirectUrisToArrayObjects(selectedApp.redirect_uris);
        return selectedApp;
      }
    })
  },
  methods: {
    showDelete (index, editedCallbacks) {
      return (index < editedCallbacks.length - 1) && (editedCallbacks.length > 1);
    },
    changeLogo (event, app) {
      const logo = event.target.files[0];
      if (logo) {
        this.logo.isFetching = true;
        this.$store.dispatch('oAuthApps/uploadLogo', {
          apiKey: this.$store.state.user.api_key,
          userId: this.$store.state.user.id,
          filename: logo
        }).then(logoUrl => {
          this.app.icon_url = logoUrl;
          this.$refs.displayLogo.src = logoUrl;
          this.logo.isFetching = false;
        },
        error => {
          this.logo.error = error;
          this.logo.isFetching = false;
          });
      }
    },
    checkForm (event) {
      event.preventDefault();
      const app = {
        ...this.app,
        redirect_uris: this.redirectUrisToArrayStrings(this.editedCallbacks)
      };
      if (this.isEditMode) {
        this.updateApp(app);
      } else {
        this.createApp(app);
      }
    },
    createApp (app) {
      this.$store.dispatch('oAuthApps/create', {
        apiKey: this.$store.state.user.api_key,
        app
      })
      .then(
        createdApp => {
          this.$router.push({name: 'oauth_app_edit', params: { id: createdApp.id }})
        },
        error => {
          this.error = error;
          window.scrollTo(0, 0)
        })
      },
    updateApp (app) {
      this.$store.dispatch('oAuthApps/update', {
        apiKey: this.$store.state.user.api_key,
        app
      })
      .then(
        () => this.$router.push({ name: 'oauth_apps_list' }),
        (error) => {
          this.error = error;
          window.scrollTo(0, this.$refs.formScroll.offsetTop)
        }
      );
    },
    deleteApp () {
      this.$store.dispatch('oAuthApps/delete', {
        apiKey: this.$store.state.user.api_key,
        app: this.app
      }).then(
        () => this.$router.push({ name: 'oauth_apps_list' })
      );
    },
    regenerateClientSecret () {
      this.$store.dispatch('oAuthApps/regenerateClientSecret', {
        apiKey: this.$store.state.user.api_key,
        app: this.app
      });
      this.isRegenerateModalOpen = false;
    },
    addCallbackUrl (index) {
      this.editedCallbacks.push({ name: '' });
    },
    removeCallbackUrl (index) {
      this.editedCallbacks.splice(index, 1);
    },
    redirectUrisToArrayObjects (redirectUris) {
      return redirectUris.map(r => ({ name: r }));
    },
    redirectUrisToArrayStrings (redirectUris) {
      return redirectUris.map(r => r.name).filter(Boolean);
    },
    openDeleteAppModal () {
      this.isDeleteModalOpen = true;
    },
    openRegenerateAppModal () {
      this.isRegenerateModalOpen = true;
    },
    closeModal () {
      this.isDeleteModalOpen = false;
      this.isRegenerateModalOpen = false;
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
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

.appform__block {
  display: flex;
  flex-direction: column;
  margin-bottom: 24px;
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

.appform__input {
  box-sizing: border-box;
  width: 300px;
  min-height: 32px;
  margin-bottom: 6px;
  padding: 7px 8px;
  border: 1px solid $neutral--400;
  border-radius: 4px;
  font-family: 'Open Sans', sans-serif;
  font-size: 12px;
  line-height: 16px;

  &.has-error {
    border: 1px solid  $danger__color;
  }

  &:hover {
    border: 1px solid $blue--700;
  }

  &:focus {
    border: 1px solid $neutral--400;
    box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.5);
  }

  &--textarea {
    min-height: 60px;
  }

  &-desc {
    color: $neutral--600;
    font-family: 'Open Sans', sans-serif;
    font-size: 10px;
    line-height: 16px;
  }

  &-desc--12 {
    margin-top: 4px;
    font-size: 12px;
  }
}

.appform__link {
  color: $color-primary;
  font-family: 'Open Sans', sans-serif;
  font-size: 12px;
  line-height: 22px;
  cursor: pointer;

  &--delete {
    color: $danger__color;
  }

  &:hover {
    text-decoration: underline;
  }
}

.appform__logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 100px;
  margin-right: 20px;
  border: 1px solid $neutral--400;
  border-radius: 4px;

  &.has-error {
    border: 1px solid  $danger__color;
  }
}

.appform__logo-image {
  max-width: 100px;
  max-height: 100px;

  .is-hidden {
    visibility: hidden;
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

.appform__error {
  color: $danger__color;
  font-size: 10px;
}

.appform__block--file {
  display: flex;
  position: relative;
  flex-direction: column;

  .appform__input--file {
    position: relative;
    z-index: 2;
    -moz-opacity: 0;
    opacity: 0;
    text-align: right;
    cursor: pointer;
  }

  .appform__link {
    position: absolute;
    z-index: 1;
    top: 0;
    left: 0;
  }
}

.oauthapps {
  display: flex;
  width: 940px;
  margin: 20px auto 0;
  padding: 0;

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

  &__badge {
    display: block;
    position: absolute;
    top: -9px;
    right: -9px;
    animation: fade-and-bounce-up 0.6s 0.35s ease-in-out backwards;
  }

  &__back {
    cursor: pointer;
  }
}

.oauthapps__modal {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  width: 100%;
  height: 100%;
}

.oauthapps__modal-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 960px;
  margin: 0 auto;
  padding: 0;
}

.oauthapps__modal-actions {
  display: flex;
  justify-content: center;
  width: 100%;
  margin-top: 54px;
  padding-top: 38px;
  border-top: 1px solid $neutral--300;
}

.oauthapps__modal-button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 18px;
  border: 1px solid $color-primary;
  border-radius: 4px;
  background-color: transparent;
  color: $color-primary;
  font-family: 'Open Sans', sans-serif;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0;
  text-transform: uppercase;
  cursor: pointer;

  &:hover {
    background-color: transparent;
    text-decoration: underline;
  }

  &--regenerate,
  &--delete {
    border: none;
    background-color: $button-alert__bg-color;
    color: $white;

    &:hover {
      background-color: $button-alert__bg-color--hover;
      text-decoration: none;
    }
  }
}

.appform__button {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 18px;
  border-radius: 4px;
  background-color: $button__bg-color;
  color: $white;
  font-family: 'Open Sans', sans-serif;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0;
  text-transform: uppercase;
  cursor: pointer;

  &:hover {
    background-color: $button__bg-color--hover;
    text-decoration: none;
  }

  &--cancel {
    border: none;
    background: transparent;
    color: $color-primary;
    text-transform: none;

    &:hover {
      background-color: transparent;
      text-decoration: underline;
    }
  }

  &--delete {
    border: 1px solid $red--600;
    background: transparent;
    color: $red--600;
    text-transform: none;

    &:hover {
      background-color: transparent;
      text-decoration: underline;
    }
  }

  &--regenerate {
    border: 1px solid $button-outline__color;
    background-color: transparent;
    color: $button-outline__border-color;
    text-transform: none;

    &:hover {
      background-color: transparent;
      text-decoration: underline;
    }
  }


}

</style>
