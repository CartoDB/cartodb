<template>
  <div class="u-flex u-flex__align--center copy-container">
    <span class="text is-txtSoftGrey is-small">ID</span>
    <input ref="inputCopy" class="text u-ml--12 is-small" type="text" readonly :value="slug">
    <SubscriptionButtonTooltip>
      <button type="button" class="u-flex u-flex__align--center u-flex__justify--center" @click="copy" @mouseleave="copied=false">
        <img svg-inline src="../../assets/icons/catalog/copy.svg">
        <div class="text tooltip is-small is-txtWhite u-flex u-flex__align--center">
          <template v-if="!copied">
            Copy ID to use in CARTOframes
          </template>
          <template v-else>
            <img width="12" class="u-mr--4" src="../../assets/icons/catalog/check_white.svg">
            Copied to clipboard
          </template>
        </div>
      </button>
    </SubscriptionButtonTooltip>
  </div>
</template>

<script>

import SubscriptionButtonTooltip from './SubscriptionButtonTooltip';

export default {
  name: 'SlugCopy',
  components: {
    SubscriptionButtonTooltip
  },
  props: {
    slug: {
      type: String,
      required: true
    }
  },
  data () {
    return {
      copied: false
    };
  },
  computed: {},
  methods: {
    copy () {
      this.$refs.inputCopy.select();
      document.execCommand('copy');
      this.copied = true;
    }
  }
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';
.copy-container {
  height: 32px;

  button {
    position: relative;
  }
  span {
    white-space: nowrap;
  }
  input[type="text"] {
    border: solid 1px $neutral--400;
    border-radius: 4px;
    padding: 0 12px;
    height: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
    outline: none;
  }
  button {
    width: 32px;
    height: 100%;
    background-color: $neutral--100;
    border: solid 1px $neutral--400;
    border-radius: 4px;
    border-left: none;
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    outline: none;
    > svg {
      outline: none;
    }
  }
}
</style>
