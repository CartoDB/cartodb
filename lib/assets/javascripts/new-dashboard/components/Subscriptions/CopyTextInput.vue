<template>
  <div class="u-flex u-flex__align--center u-flex__justify--between u-mt--24 input-wrapper">
    <label class="is-small u-mr--12">{{label}}</label>
    <div class="input">
      <input ref="value" :value="value" type="text" :placeholder="$t('DataPage.imports.database.placeholder-name')" readonly>
      <span class="text is-small copy-text" @click="copy">
        <img svg-inline class="copy-icon" src="../../assets/icons/catalog/copy.svg">
      </span>
    </div>
  </div>
</template>

<script>

export default {
  name: 'CopyTextInput',
  props: {
    label: {
      default: ''
    },
    value: String
  },
  data () {
    return {
    };
  },
  computed: {
  },
  methods: {
    copy () {
      this.$refs.value.select();
      document.execCommand('copy');
    }
  }
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";

.input-wrapper {
  label {
    flex: 1;
    text-align: right;
    text-transform: capitalize;
    white-space: nowrap;
  }
  .input {
    position: relative;
    width: 512px;
    border: solid 1px #dddddd;
    border-radius: 4px;
    background-color: $white;
    height: 40px;

    & input {
      padding: 12px 0 12px 12px;
      border: none;
      font-size: 12px;
      color: $neutral--800;
      background: transparent;
      width: calc(100% - 38px);
    }

    & input::placeholder {
      color: rgba(46, 60, 67, 0.48);
    }

    & input:-ms-input-placeholder {
      color: rgba(46, 60, 67, 0.48);
    }

    & input::-ms-input-placeholder {
      color: rgba(46, 60, 67, 0.48);
    }

    & .copy-text {
      position: absolute;
      display: flex;
      right: 0px;
      top: 0px;
      height: 38px;
      width: 38px;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      border-radius: 0 4px 4px 0;
      background-color: $neutral--100;
      border-left: 1px solid #ddd;
    }
  }
}
</style>
