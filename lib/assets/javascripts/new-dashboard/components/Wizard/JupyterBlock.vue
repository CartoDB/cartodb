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
      return `jupyter-${this.inputType}`
    }
  }
};
</script>

<style lang="scss">
@import 'new-dashboard/styles/variables';

.jupyter-title {
  width: 35px;
  margin-top: 6px;
  font-family: 'Source Code Pro', monospace;
  font-size: 14px;
  text-align: right;
}

.jupyter-content {
  width: 100%;
  overflow: scroll;
}

.jupyter-in {
  .jupyter-title {
    color: #DA4D24;
  }

  .CodeMirror {
    width: 100%;
    padding: 0 4px;
    border: 1px solid #CFCFCF;
    background-color: #F7F7F7;
  }
}

.jupyter-out {
  .jupyter-title {
    color: #2F3F9F;
  }

  .CodeMirror {
    width: 100%;
    padding: 0 4px;
  }
}

</style>

