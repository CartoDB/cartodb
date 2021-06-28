<template>
<div>
  <p>Find below the instructions to access your Data Observatory subscription directly in {{platformName}}.</p>
  <div class="textarea-wrapper">
    <textarea ref="textarea" class="u-mt--24" v-model="accessInfo" readonly />
    <div class="u-flex u-flex__justify--end">
        <button @click="copy"  class="copy-btn u-flex u-flex__align--center text is-small is-semibold is-txtPrimary">
          <img svg-inline class="copy-icon" src="../../assets/icons/catalog/copy.svg">
          Copy
        </button>
    </div>
  </div>
</div>
</template>

<script>

import { mapState } from 'vuex';

export default {
  name: 'OtherAccessParameters',
  props: {
    platformName: {
      require: true
    },
    platform: {
      require: true
    },
    subscription: {
      require: true
    }
  },
  data () {
    return {
    };
  },
  computed: {
    ...mapState({
      user: state => state.user
    }),
    accessInfo () {
      if (this.platform === 'aws') {
        return this.subscription.full_access_aws_info;
      } else {
        return this.subscription.full_access_azure_info;
      }
    }
  },
  methods: {
    copy () {
      this.$refs.textarea.select();
      document.execCommand('copy');
    }
  }
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";
.textarea-wrapper {
  width: 100%;

  textarea {
    height: 96px;
    width: 100%;
    padding: 12px;
    color: $neutral--800;
    border: solid 1px #dddddd;
    border-radius: 4px;
    resize: none;
  }
}

.copy-btn {
  height: 36px;
  padding: 6px 8px;

  .copy-icon {
    height: 24px;
    width: 24px;

    path:not(:first-child){
      fill: $color-primary
    }
  }
}
</style>
