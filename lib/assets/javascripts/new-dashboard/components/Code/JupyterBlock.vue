<template>
    <div :class="inputClass" class="u-flex u-flex__align--start">
      <span class="jupyter-title u-mr--8">{{ $t(`Wizards.cartoframes.jupyter.${inputType}`) }}</span>
      <div class="jupyter-content">
        <slot></slot>
      </div>
    </div>
</template>
<script>
export default {
  name: 'JupyterBlock',
  props: {
    isInput: {
      type: Boolean,
      default: true
    }
  },
  computed: {
    inputType () {
      return this.isInput ? 'in' : 'out';
    },
    inputClass () {
      return `jupyter-${this.inputType}`;
    }
  }
};
</script>
<style lang="scss">
@import 'new-dashboard/styles/variables';

.jupyter-title {
  width: 35px;
  margin-top: 11px;
  font-family: 'Source Code Pro', monospace;
  font-size: 14px;
  text-align: right;
}

.jupyter-content {
  width: 100%;
  overflow: auto;

  .CodeMirror {
    width: 100%;
    margin: 0;
    padding: 0 4px;
  }
}

.jupyter-in {
  .jupyter-title {
    color: $jupyter__text--in;
  }

  .CodeMirror {
    border: 1px solid $jupyter__border-color;
    background-color: $jupyter__fill-color;
  }
}

.jupyter-out {
  .jupyter-title {
    color: $jupyter__text--out;
  }
}

</style>
