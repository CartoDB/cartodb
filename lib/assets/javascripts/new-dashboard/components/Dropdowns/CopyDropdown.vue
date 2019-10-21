<template>
    <div class="dropdown" v-if="isVisible" @click.prevent="copyName">
      <span class="text is-small copy-text" v-if="!copySuccessful"><img svg-inline class="copy-icon" src="../../assets/icons/common/copy.svg">{{$t(`DatasetCard.copy`)}}</span>
      <span class="text is-small is-txtGrey" v-if="copySuccessful"><img svg-inline class="copy-icon" src="../../assets/icons/common/copy-success.svg">{{$t(`DatasetCard.copySuccess`)}}</span>
    </div>
</template>

<script>
export default {
  name: 'CopyDropdown',
  props: {
    textToCopy: String,
    isVisible: Boolean
  },
  data () {
    return {
      copySuccessful: false,
      hideDropdownTimeout: null
    };
  },
  watch: {
    isVisible: function (newVal, oldVal) {
      if (newVal === false) {
        this.resetDropdown();
      }
    }
  },
  methods: {
    copyName () {
      var textArea = document.createElement('textarea');
      textArea.style.position = 'fixed';
      textArea.style.opacity = 0;
      textArea.style.height = 0;
      textArea.style.width = 0;
      textArea.value = this.textToCopy;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        this.copySuccessful = document.execCommand('copy');
        if (this.copySuccessful) {
          this.hideDropdownTimeout = setTimeout(() => { this.$emit('hideDropdown'); }, 2000);
        }
      } catch (err) {
        this.copySuccessful = false;
      } finally {
        document.body.removeChild(textArea);
      }
    },
    resetDropdown () {
      this.copySuccessful = false;
      if (this.hideDropdownTimeout) {
        clearTimeout(this.hideDropdownTimeout);
      }
    }
  }
};
</script>

<style lang="scss" scoped>
@import 'new-dashboard/styles/variables';

.dropdown {
  position: relative;
  padding: 12px 16px 8px;
  border: 1px solid $border-color;
  border-radius: 4px;
  background-color: #FFF;

  &::before {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 24px;
    width: 14px;
    height: 14px;
    transform: rotate(45deg);
    border: 1px solid $neutral--200;
    border-top: none;
    border-left: none;
    border-radius: 2px;
    background-color: #FFF;
  }
}

.copy-text {
  text-decoration: underline;
}

.copy-icon {
  margin-right: 8px;
  margin-bottom: -2px;
}
</style>
