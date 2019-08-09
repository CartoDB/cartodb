<template>
  <form id="app" @submit="onSubmit">
    <div class="appform__block">
      <label class="appform__label" for="app.name">{{ $t(`OAuthAppsPage.form.appName`) }}</label>

      <input class="appform__input" :class="{'has-error': !!error.name}" type="text" name="app.name" id="app.name" v-model="app.name">
      <span v-if="error.name" class="appform__error u-mt--4">
        {{ getStringErrorFromArray(error.name, $t(`OAuthAppsPage.form.appName`)) }}
      </span>

      <span class="appform__input-desc">{{ $t(`OAuthAppsPage.form.appNameDesc`) }}</span>
    </div>

    <div class="appform__block">
      <label class="appform__label" for="app.website_url">{{ $t(`OAuthAppsPage.form.webUrl`) }}</label>
      <input class="appform__input" type="text" name="app.website_url" id="app.website_url" v-model="app.website_url">
      <span v-if="error.website_url" class="appform__error u-mt--4">
        {{ getStringErrorFromArray(error.website_url, $t(`OAuthAppsPage.form.webUrl`)) }}
      </span>
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
        <li v-for="(callbackUrl, k) in app.redirect_uris" :key="k">
          <input class="appform__input" :class="{'has-error': !!error.redirect_uris}" type="text" name="callbackUrl" id="callbackUrl" v-model="callbackUrl.name" :placeholder="$t(`OAuthAppsPage.form.callbackUrlPlaceholder`)">
          <span v-show="shouldShowDelete(k, app.redirect_uris)" class="appform__link u-ml--16 appform__link--delete" @click="removeCallbackUrl(k)">{{ $t(`OAuthAppsPage.form.callbackUrlDelete`) }}</span>
          <span v-show="k == app.redirect_uris.length-1" class="appform__link u-ml--16" @click="addCallbackUrl(k)">{{ $t(`OAuthAppsPage.form.callbackUrlAddMore`) }}</span>
        </li>
      </ul>

      <span v-if="error.redirect_uris" class="appform__error">
        {{ getStringErrorFromArray(error.redirect_uris, $t(`OAuthAppsPage.form.callbackUrls`)) }}
      </span>

      <span class="appform__input-desc" v-html="$t(`OAuthAppsPage.form.callbackUrlsDesc`)"></span>
    </div>

    <div class="appform__block">
      <label class="appform__label" for="app.logoUrl">
        {{ $t(`OAuthAppsPage.form.logoUpload`) }}<span class="appform__label--optional">&nbsp;{{ $t(`OAuthAppsPage.form.optional`) }}</span>
      </label>

      <UploadImage :currentImage="app.icon_url" @imageUpload="onImageUploaded">
        <p class="appform__input-desc appform__input-desc--12" v-html="$t(`OAuthAppsPage.form.logoUploadDesc`)"></p>
        <p v-if="error.icon_url" class="appform__error u-mt--4">
          {{ getStringErrorFromArray(error.icon_url, $t(`OAuthAppsPage.form.logo`)) }}
        </p>
      </UploadImage>
    </div>

    <slot />
  </form>
</template>

<script>
import UploadImage from '../UploadImage';

export default {
  name: 'FormComponent',
  components: {
    UploadImage
  },
  props: {
    oAuthApplication: {
      type: Object,
      default () {
        return {};
      }
    },
    error: {
      type: Object,
      default () {
        return {};
      }
    }
  },
  watch: {
    oAuthApplication (newApplication) {
      this.app = newApplication;
      this.app.redirect_uris = this.redirectUrisToArrayObjects(this.app.redirect_uris);
    }
  },
  data () {
    const app = {
      redirect_uris: [{ name: '' }],
      ...this.$props.oAuthApplication
    };

    if (this.$props.oAuthApplication &&
        this.$props.oAuthApplication.redirect_uris) {
      app.redirect_uris = this.redirectUrisToArrayObjects(this.$props.oAuthApplication.redirect_uris);
    }

    return { app };
  },
  methods: {
    getStringErrorFromArray (errorArray, fieldName) {
      const errors = errorArray.map(error => (`${fieldName} ${error}.`));
      return errors.join(' ');
    },
    shouldShowDelete (index) {
      return index > 0;
    },
    onSubmit (event) {
      event.preventDefault();

      const app = {
        ...this.app,
        redirect_uris: this.redirectUrisToArrayStrings(this.app.redirect_uris)
      };

      this.$emit('submit', app);
    },
    addCallbackUrl (index) {
      this.app.redirect_uris.push({ name: '' });
    },
    removeCallbackUrl (index) {
      this.app.redirect_uris.splice(index, 1);
    },
    redirectUrisToArrayObjects (redirectUris) {
      return redirectUris.map(r => ({ name: r }));
    },
    redirectUrisToArrayStrings (redirectUris) {
      return redirectUris.map(r => r.name).filter(Boolean);
    },
    onImageUploaded (imageSrc) {
      this.app.icon_url = imageSrc;
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

.appform__block {
  display: flex;
  flex-direction: column;
  margin-bottom: 24px;
}

.appform__label,
.appform__input {
  font-family: 'Open Sans', sans-serif;
  font-size: 12px;
  line-height: 16px;
}

.appform__label {
  margin-bottom: 8px;
  font-weight: 600;

  &--optional {
    font-weight: 400;
  }
}

.appform__input {
  width: 300px;
  margin-bottom: 6px;
  padding: 12px;
  border: 1px solid $neutral--400;
  border-radius: 4px;

  &.has-error {
    border: 1px solid  $danger__color;
  }

  &:hover {
    border: 1px solid $blue--700;
  }

  &:focus {
    border: 1px solid $neutral--400;
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
</style>
