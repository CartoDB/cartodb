<template>
  <div class="u-flex u-flex__direction--column u-flex__align--center">
    <span v-if="!reduced" class="is-small u-mb--32">{{ label }}</span>
    <div v-show="!isFileSelected">
      <div ref="dragZone" :class="{
        dragged: dragged,
        'u-flex__direction--column': !reduced,
        'u-flex__justify--center': !reduced,
        reduced: reduced
      }" class="drag-zone u-flex u-flex__align--center">
        <img svg-inline src="../../assets/icons/datasets/move-up.svg">
        <h4 v-if="!reduced" class="is-small is-semibold u-mt--16" style="text-align: center;">Drag and drop your file<br>or</h4>
        <h4 v-else class="text is-small is-txtMidGrey u-ml--12 u-flex__grow--1">Drag &amp; drop your file</h4>
        <button @click="selectFile()" class="button button--outline" :class="{'u-mt--16': !reduced}">Browse</button>
        <input @change="fileSelected" :accept="supportedFormatsList" ref="file" type="file">
      </div>
    </div>
    <div v-if="isFileSelected" class="u-flex u-flex__align--center u-flex__justify--between u-pl--24 u-pr--24 file">
      <div class="is-txtMainTextColor u-flex u-flex__direction--column file-main">
        <template >
          <span class="is-caption">{{file.name}}</span>
          <span class="is-small is-txtMidGrey" style="margin-top:2px;">{{humanFileSize(file.size)}}</span>
        </template>
      </div>
      <button @click="clearFile();">
        <img src="../../assets/icons/common/delete.svg">
      </button>
    </div>
    <div class="error-wrapper text is-small is-txtAlert u-flex u-flex__grow--1 u-flex__justify--start u-mt--16" v-if="error">
      {{ error }}
    </div>
  </div>
</template>

<script>

import Dropzone from 'dropzone';
import uploadData from '../../mixins/connector/uploadData';
import * as Formatter from 'new-dashboard/utils/formatter';
require('dragster');

export default {
  name: 'FileInput',
  components: {},
  inject: ['backboneViews'],
  mixins: [uploadData],
  props: {
    label: null,
    reduced: Boolean,
    supportedFormats: {
      type: Array,
      required: false
    }
  },
  data () {
    return {
      error: null,
      file: null,
      dragged: false
    };
  },
  computed: {
    supportedFormatsList () {
      return this.supportedFormats.map(format => `.${format}`);
    },
    editing () {
      return false;
    },
    connectionModelIsValid () {
      return false;
    },
    isFileSelected () {
      return !!this.file;
    }
  },
  mounted () {
    this.clearFile();
    this.dragster = new Dragster(this.$refs.dragZone); // eslint-disable-line
    this.$refs.dragZone.addEventListener('dragster:enter', this.dragsterEnter);
    this.$refs.dragZone.addEventListener('dragster:leave', this.dragsterLeave);
    this.dropzone = new Dropzone(this.$refs.dragZone, {
      url: ':)',
      autoProcessQueue: false,
      previewsContainer: false
    });
    this.dropzone.on('drop', e => {
      this.dragster.dragleave(event);
      this.dropzone.removeFile(event);
      this.setFile(event.dataTransfer.files);
    });
  },
  methods: {
    dragsterEnter () {
      this.dragged = true;
    },
    dragsterLeave () {
      this.dragged = false;
    },
    selectFile () {
      this.$refs.file.click();
    },
    fileSelected (event) {
      this.setFile(event.target.files);
      event.target.value = '';
    },
    setFile (files) {
      this.clearFile();

      if (files && files.length > 0) {
        this.file = files[0];

        if (this.validateFileExtension()) {
          this.$emit('change', this.file);
        } else {
          this.error = this.$t('FileInput.extensionError');
        }
      }
    },
    clearFile () {
      this.file = null;
      this.error = '';
      this.$emit('change', this.file);
    },
    validateFileExtension () {
      const name = this.file.name;
      let ext = name.substr(name.lastIndexOf('.') + 1);
      if (ext) {
        ext = ext.toLowerCase();
      }
      if (!this.supportedFormats || !this.supportedFormats.length) {
        return true;
      } else {
        return this.supportedFormats.some(format => format === ext);
      }
    },
    humanFileSize (size) {
      return Formatter.humanFileSize(size);
    }
  },
  beforeDestroy () {
    if (this.dragster) {
      this.dragster.removeListeners();
      this.dragster.reset();
    }
    this.$refs.dragZone.removeEventListener('dragster:enter', this.dragsterEnter);
    this.$refs.dragZone.removeEventListener('dragster:leave', this.dragsterLeave);
    if (this.dropzone) {
      this.dropzone.destroy();
    }
  }
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";
.error-wrapper {
  width: 100%;
}
.drag-zone {
  width: 460px;
  height: 204px;
  border-radius: 4px;
  border: dashed 2px #dddddd;
  background-color: $white;
  transition: border-color 0.25s linear;
  >* {
    transition: opacity 0.25s linear;
  }

  &.reduced {
    height: 60px;
    padding: 12px 12px 12px 16px;

    svg {
      height: 24px;
      width: 24px;
    }
  }

  path {
    fill: $neutral--600;
  }

  &.dragged {
    border-color: $blue--500;
    >* {
      opacity: 0.5;
    }
  }
}
input[type=file] {
  display: none;
}
.file {
  background-color: $white;
  height: 74px;
  width: 460px;
  border-radius: 4px;
  border: 1px solid $blue--500;
  margin: 0 auto;
}

.file-main {
  max-width: calc(100% - 24px);

  .url-text {
    text-overflow: ellipsis;
    white-space: nowrap;
    overflow: hidden;
  }
}

ul {
  max-width: 588px;
  list-style: disc;

  li {
    font-size: 12px;
  }
}
</style>
