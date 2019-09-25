<template>
  <section class="image-uploader">
    <div class="image-uploader__preview" :class="{'has-error': error.length}">
      <img v-if="isUploading" svg-inline src="new-dashboard/assets/icons/apps/spinner.svg">
      <img v-else class="image-uploader__placeholder" :src="imageSrc || currentImage || defaultImage">
    </div>

    <div class="image-uploader__upload">
      <input
        ref="fileInput"
        type="file"
        class="image-uploader__input"
        accept="image/jpeg,image/jpg,image/png,image/gif"
        @change="changeLogo">

      <a class="image-uploader__action is-small text" @click="onLinkClick">
        {{ $t(`OAuthAppsPage.form.logoUploadLink`) }}
      </a>

      <p v-if="error.length" class="image-uploader__error u-mt--4">
        {{error.join('. ')}}
      </p>

      <slot v-if="!error.length" />
    </div>
  </section>
</template>

<script>
import { mapState } from 'vuex';
export default {
  name: 'UploadImage',
  props: {
    currentImage: String
  },
  data () {
    return {
      isUploading: false,
      imageSrc: null,
      defaultImage: require('new-dashboard/assets/icons/apps/logo-default.svg'),
      error: []
    };
  },
  computed: mapState({
    apiKey: state => state.user.api_key,
    userId: state => state.user.id,
    client: state => state.client
  }),
  methods: {
    changeLogo (event) {
      const logo = event.target.files[0];

      if (!logo) {
        return;
      }

      this.isUploading = true;

      this.uploadLogo(logo)
        .then(
          logoUrl => {
            this.imageSrc = logoUrl;
            this.isUploading = false;

            this.$emit('imageUpload', logoUrl);
          },
          error => {
            this.error = error;
            this.isUploading = false;

            this.$emit('uploadError', error);
          }
        );
    },
    onLinkClick () {
      this.$refs.fileInput.click();
    },
    uploadLogo (filename) {
      return new Promise((resolve, reject) => {
        this.client.uploadLogo(this.apiKey, this.userId, filename, function (err, _, data) {
          if (err) {
            const error = data.responseJSON && data.responseJSON.error || [data.statusText];
            return reject(error);
          }
          resolve(data.public_url);
        });
      });
    }
  }
};
</script>

<style lang="scss" scoped>
@import 'new-dashboard/styles/variables';

.image-uploader {
  display: flex;
  flex-direction: row;
}

.image-uploader__preview {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 100px;
  margin-right: 20px;
  overflow: hidden;
  border: 1px solid $neutral--400;
  border-radius: 4px;

  &.has-error {
    border: 1px solid  $danger__color;
  }
}

.image-uploader__placeholder {
  max-width: 100px;
  max-height: 100px;

  .is-hidden {
    visibility: hidden;
  }
}

.image-uploader__upload {
  display: flex;
  position: relative;
  flex-direction: column;

  .image-uploader__input {
    position: absolute;
    top: 0;
    left: 0;
    opacity: 0;
  }

  .image-uploader__action {
    z-index: 2;
    margin-top: 10px;
    color: $color-primary;
    cursor: pointer;

    &:hover {
      text-decoration: underline;
    }
  }
}

.image-uploader__error {
  color: $danger__color;
  font-size: 10px;
}
</style>
