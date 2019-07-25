<template>
  <div>
    <div class="oauthapps__title u-flex__justify--start">
      <img class="oauthapps__back" @click="toggleActiveForm" svg-inline src="../assets/icons/apps/back-arrow.svg" />
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
                <img svg-inline src="../assets/icons/apps/logo-default.svg">
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
</template>

<script>
import Page from 'new-dashboard/components/Page';
import SettingsSidebar from 'new-dashboard/components/App/SettingsSidebar';
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
      appName: '',
      appWebsite : '',
      appDescription: '',
      callbackUrls: [
        { name: '' }
      ],
      logoUrl: ''
    };
  },
  computed: {
    ...mapState({
      isFetchingApps: state => state.apps.isFetching,
      user: state => state.user,
      baseUrl: state => state.user.base_url,
      apps: state => state.apps.apps,
      error: state => state.apps.error,
    })
   },
  methods: {
    checkForm (e) {
      const app = {
       name: this.appName,
        redirect_uris: this.callbackUrls.map(callbackUrl => callbackUrl.name),
        icon_url: 'https://www.google.com/'
      }
      this.$store.dispatch('apps/create', {
        apiKey: this.$store.state.user.api_key,
        app
      });
      e.preventDefault();
    },
    addCallbackUrl(index) {
      this.callbackUrls.push({ name: '' });
    },
    removeCallbackUrl(index) {
      this.callbackUrls.splice(index, 1);
    }
   }

};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
@import 'new-dashboard/styles/variables';


.button--ghost {
  padding: 8px 12px;
  border: 1px solid $blue--500;
  background: none;
  color: $blue--500;
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
