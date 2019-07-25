<template>
  <Page>
    <div class="oauthapps grid">
      <SettingsSidebar class="grid-cell--col4" :userModel="user" :baseUrl="baseUrl" />
      <div class="oauthapps__container grid-cell--col8" :class="{'is-active': !isFormActive}">
        <div class="oauthapps__title">
          <h2 class="text is-small is-semibold">{{ $t(`OauthAppsPage.title`) }}</h2>
          <button class="oauthapps__button oauthapps__button--small button" @click="toggleActiveForm">{{ $t(`OauthAppsPage.newAppButton`) }}</button>
        </div>
        <p v-if="!hasOauthApps" v-html="$t(`OauthAppsPage.emptyDescription`)" class="text is-caption"></p>
        <div v-else class="oauthapps__list">
          <ul>
            <li v-for="app in apps" :key="app.id" class="oauthapps__item">
              <div class="oauthapps__icon u-mr--20">
                <img svg-inline src="../../assets/icons/apps/default.svg">
              </div>
              <div class="oauthapps__item-info">
                <span class="text is-small is-semibold oauthapps__item-title">{{ app.name }}</span>
                <span class="text is-small oauthapps__item-description">{{ app.description }}</span>
              </div>
              <button class="oauthapps__button button button--ghost" @click="openModal(app)">{{ $t(`OauthAppsPage.editButton`) }}</button>

            </li>
          </ul>
        </div>
        <p class="text is-small u-mt--32" v-html="$t(`OauthAppsPage.description`)"></p>
      </div>



      <!-- Form -->
      <div class="oauthapps__container grid-cell--col8" :class="{'is-active': isFormActive}">
        <div class="oauthapps__title u-flex__justify--start">
          <img class="oauthapps__back" @click="toggleActiveForm" svg-inline src="../../assets/icons/apps/back-arrow.svg" />
          <h2 class="text is-small is-semibold u-ml--12">{{ $t(`OauthAppsPage.form.newTitle`) }}</h2>
        </div>

        <div>
          <form id="app" @submit="checkForm">
  
              <p v-if="error">
                <b>Please correct the following error(s):</b>
                {{error}}
              </p>
              
              <div class="form__block">
                <label class="form__label" for="appName">{{ $t(`OauthAppsPage.form.appName`) }}</label>
                <input class="form__input" :class="{'has-error': !!error.name}" type="text" name="appName" id="appName" v-model="appName">
                <span class="form__input-desc">{{ $t(`OauthAppsPage.form.appNameDesc`) }}</span>
                <span v-if="error.name" class="form__error">{{ $t(`OauthAppsPage.form.appName`) }}&nbsp;{{error.name}}</span>
              </div>

              <div class="form__block">
                <label class="form__label" for="appWebsite">{{ $t(`OauthAppsPage.form.webUrl`) }}</label>
                <input class="form__input" type="text" name="appWebsite" id="appWebsite" v-model="appWebsite">
                <span class="form__input-desc">{{ $t(`OauthAppsPage.form.webUrlDesc`) }}</span>
              </div>

              <div class="form__block">
                <label class="form__label" for="appDescription">{{ $t(`OauthAppsPage.form.description`) }}<span class="form__label--optional">&nbsp;{{ $t(`OauthAppsPage.form.optional`) }}</span></label>
                <textarea class="form__input form__input--textarea" type="text" name="appDescription" id="appDescription" v-model="appDescription"></textarea>
                <span class="form__input-desc" v-html="$t(`OauthAppsPage.form.descriptionDesc`)"></span>
              </div>

              <div class="form__block">
                <label class="form__label" for="appCallbacks">{{ $t(`OauthAppsPage.form.callbackUrls`) }}</label>
                <ul>
                  <li v-for="(callbackUrl, k) in callbackUrls" :key="k">
                    <input class="form__input" :class="{'has-error': !!error.redirect_uris}" type="text" name="callbackUrl" id="callbackUrl" v-model="callbackUrl.name">
                    <span v-show="k || ( !k && callbackUrls.length > 1)" class="form__link u-ml--16 form__link--delete" @click="removeCallbackUrl(k)">{{ $t(`OauthAppsPage.form.callbackUrlDelete`) }}</span>
                    <span v-show="k == callbackUrls.length-1" class="form__link u-ml--16" @click="addCallbackUrl(k)">{{ $t(`OauthAppsPage.form.callbackUrlAddMore`) }}</span>
                  </li>
                </ul>
                <span v-if="!!error.redirect_uris" class="form__error">{{ $t(`OauthAppsPage.form.callbackUrls`) }}&nbsp;{{error.redirect_uris}}</span>

                <span class="form__input-desc" v-html="$t(`OauthAppsPage.form.callbackUrlsDesc`)"></span>
              </div>

              <div class="form__block">
                <label class="form__label" for="appDescription">{{ $t(`OauthAppsPage.form.logoUpload`) }}<span class="form__label--optional">&nbsp;{{ $t(`OauthAppsPage.form.optional`) }}</span></label>
                <div class="form__block form__block--logo">
                  <div class="form__logo">
                    <img svg-inline src="../../assets/icons/apps/logo-default.svg">
                  </div>
                  <div class="u-flex u-flex__direction--column">
                    <span class="form__link">{{ $t(`OauthAppsPage.form.logoUploadLink`) }}</span>
                    <span class="form__input-desc form__input-desc--12" v-html="$t(`OauthAppsPage.form.logoUploadDesc`)"></span>
                  </div>
                </div>
              </div>

              <div class="form__toolbar">
                <button class="oauthapps__button button button--ghost u-mr--48">{{ $t(`OauthAppsPage.form.cancelButton`) }}</button>
                <button class="oauthapps__button button" type="submit" value="Submit">{{ $t(`OauthAppsPage.form.saveButton`) }}</button>
              </div>
            </form>
        </div>
      </div>
    </div>

    <!-- Delete Modal -->
    <Modal :isOpen="isModalOpen" @closeModal="closeModal">
      <div class="oauthapps__modal">
        <div class="oauthapps__modal-inner">
          <div class="oauthapps__icon u-mb--24">
            <img svg-inline src="../../assets/icons/apps/default.svg">
            <img class="oauthapps__badge" svg-inline src="../../assets/icons/apps/trash.svg">
          </div>
          <span class="text is-caption u-mb--8" v-html="$t(`OauthAppsPage.regenerateModal.title`, { name: selectedApp.name })"></span>
          <span class="text is-small is-txtSoftGrey" v-html="$t(`OauthAppsPage.regenerateModal.subtitle`)"></span>
          <div class="oauthapps__modal-actions">
            <button class="oauthapps__button button button--ghost u-mr--12" @click="closeModal">{{ $t(`OauthAppsPage.deleteModal.cancelButton`) }}</button>
            <button class="oauthapps__button button button--alert" @click="deleteApp(selectedApp)">{{ $t(`OauthAppsPage.deleteModal.deleteButton`) }}</button>
          </div>
        </div>
      </div>
    </Modal>

    <!-- Regenerate Modal -->
    <Modal :isOpen="isModalOpen" @closeModal="closeModal">
      <div class="oauthapps__modal">
        <div class="oauthapps__modal-inner">
          <div class="oauthapps__icon u-mb--24">
            <img svg-inline src="../../assets/icons/apps/default.svg">
            <img class="oauthapps__badge" svg-inline src="../../assets/icons/apps/key.svg">
          </div>
          <span class="text is-caption u-mb--8" v-html="$t(`OauthAppsPage.regenerateModal.title`, { name: selectedApp.name })"></span>
          <span class="text is-small is-txtSoftGrey" v-html="$t(`OauthAppsPage.regenerateModal.subtitle`)"></span>
          <div class="oauthapps__modal-actions">
            <button class="oauthapps__button button button--ghost u-mr--12" @click="closeModal">{{ $t(`OauthAppsPage.regenerateModal.cancelButton`) }}</button>
            <button class="oauthapps__button button button--alert" @click="deleteApp(selectedApp)">{{ $t(`OauthAppsPage.regenerateModal.regenerateButton`) }}</button>
          </div>
        </div>
      </div>
    </Modal>
  </Page>
</template>

<script>
import Page from 'new-dashboard/components/Page';
import SettingsSidebar from 'new-dashboard/components/Apps/SettingsSidebar';
import Modal from 'new-dashboard/components/Modal';
import { mapState } from 'vuex';

export default {
  name: 'OauthApps',
  components: {
    Page,
    SettingsSidebar,
    Modal
  },
  data () {
    return {
      isModalOpen: false,
      selectedApp: {},
      isFormActive: true,
      appName: '',
      appWebsite: '',
      appDescription: '',
      callbackUrls: [
        { name: '' }
      ],
      logoUrl: ''

    };
  },
  beforeMount: function () {
    this.$store.dispatch('apps/fetch', {
      apiKey: this.$store.state.user.api_key
    });
  },
  computed: {
    ...mapState({
      isFetchingApps: state => state.apps.isFetching,
      user: state => state.user,
      baseUrl: state => state.user.base_url,
      apps: state => state.apps.apps,
      error: state => state.apps.error,
      hasOauthApps () {
        return !this.isFetchingApps && (this.apps.length > 0);
      }
    })
   },
  methods: {
    openModal (selectedApp) {
      this.isModalOpen = true;
      this.selectedApp = selectedApp;
    },
    closeModal () {
      this.isModalOpen = false;
      this.selectedApp = {};
    },
    toggleActiveForm () {
      this.isFormActive = !this.isFormActive;
    },
    deleteApp (selectedApp) {
      this.$store.dispatch('apps/delete', {
        apiKey: this.$store.state.user.api_key,
        id: selectedApp.id
      });
    },
    checkForm (e) {
      const app = {
        name: this.appName,
        redirect_uris: this.callbackUrls.map(callbackUrl => callbackUrl.name),
        icon_url: 'https://www.google.com/'
      };
      this.$store.dispatch('apps/create', {
        apiKey: this.$store.state.user.api_key,
        app
      });
      e.preventDefault();
    },
    addCallbackUrl (index) {
      this.callbackUrls.push({ name: '' });
    },
    removeCallbackUrl (index) {
      this.callbackUrls.splice(index, 1);
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.oauthapps {
  display: flex;
  width: 940px;
  margin: 0 auto;
  padding: 0;

  &__container {
    display: none;
  }

  &__container.is-active {
    display: flex;
    flex-direction: column;
    width: 100%;
    padding-left: 82px;
  }

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

.button--ghost {
  padding: 8px 12px;
  border: 1px solid $blue--500;
  background: none;
  color: $blue--500;
}

.oauthapps__button {
  font-family: 'Open Sans', sans-serif;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;

  &__small {
    font-size: 10px;
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

.form__block {
  display: flex;
  flex-direction: column;
  margin-bottom: 24px;

  &--logo {
    flex-direction: row;

  }
}

.form__label {
  margin-bottom: 8px;
  font-family: 'Open Sans', sans-serif;
  font-size: 12px;
  font-weight: 600;
  line-height: 16px;

  &--optional {
    font-weight: 400;
  }
}

.form__input {
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

.form__link {
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

.form__logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 100px;
  margin-right: 20px;
  border: 1px solid $neutral--400;
  border-radius: 4px;
}

.form__toolbar {
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  width: 100%;
  height: 70px;
  border-top: 1px solid $neutral--400;
}

.form__error {
  color: $danger__color;
}

</style>
