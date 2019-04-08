<template>
  <textarea ref="code" v-model="code"></textarea>
</template>

<script>
import CodeMirror from 'codemirror';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/python/python';
import 'codemirror/mode/shell/shell';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/material.css';

export default {
  name: 'CodeBlock',
  data () {
    return {
      codemirror: null
    };
  },
  mounted () {
    this.initialize();
  },
  beforeDestroy () {
    this.destroy();
  },
  props: {
    code: String,
    language: {
      type: String,
      default: 'javascript'
    },
    lineNumbers: {
      type: Boolean,
      default: true
    },
    theme: {
      type: String,
      default: 'material'
    }
  },
  methods: {
    initialize () {
      const allOptions = {
        mode: this.language,
        lineNumbers: this.lineNumbers,
        theme: this.theme,
        ...defaultOptions
      }
      this.codemirror = CodeMirror.fromTextArea(this.$refs.code, allOptions);
    },
    destroy () {
      const codemirrorElement = this.codemirror.doc.cm.getWrapperElement();
      codemirrorElement.remove && codemirrorElement.remove();
    }
  },
  watch: {
    code () {
      this.codemirror.setValue(this.code);
    }
  }
};

const defaultOptions = {
  readOnly: true,
  addModeClass: true
};

</script>
<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

</style>
