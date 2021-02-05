<template>
<div class="error-wrapper text is-small u-mt--32">
    <span v-html="message"></span>
    <template v-if="moreInfo">
      <div class="u-mt--12 text is-semibold">Error info:</div>
      <div class="u-mt--12 u-flex text is-semibold">
        <div class="code u-flex__grow--1 is-code">{{ moreInfo }}</div>
        <div @click="copyInfo" class="u-ml--4 copy">
          <img svg-inline src="../../assets/icons/catalog/copy.svg">
        </div>
      </div>
    </template>
</div>
</template>

<script>
export default {
  name: 'ErrorMessage',
  props: {
    message: null,
    moreInfo: null
  },
  methods: {
    copyInfo () {
      const textArea = document.createElement('textarea');
      textArea.style.position = 'fixed';
      textArea.style.opacity = 0;
      textArea.style.height = 0;
      textArea.style.width = 0;
      textArea.value = this.moreInfo;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
      } catch (err) {
        console.error(err);
      } finally {
        document.body.removeChild(textArea);
      }
    }
  }
};
</script>

<style lang="scss">
@import 'new-dashboard/styles/variables';

.error-wrapper {
  max-width: 460px;
  position: relative;
  padding: 16px 16px 16px 44px;
  background-color: #fde8e7;
  border-radius: 4px;

  a {
    color: inherit;
    font-weight: bold;
    text-decoration: underline;
  }

  &:before {
    content: '';
    position: absolute;
    display: block;
    background-image: url("../../assets/icons/common/error.svg");
    height: 24px;
    width: 24px;
    top: 12px;
    left: 12px;
  }
}
.code {
  max-width: 100%;
  border-radius: 4px;
  padding: 10px 12px;
  background-color: rgba(255, 255, 255, 0.4);
  white-space: nowrap;
  overflow: auto;
}

.copy {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 36px;
  width: 36px;
  flex: 0 0 36px;
  cursor: pointer;

  &:hover {
    background-color: rgba(255, 255, 255, 0.4);
    border-radius: 4px;

  }

  svg {
    outline: none;
    transform: scale(1.5);

    path[fill] {
      fill: $red--600;
    }
  }
}

</style>
