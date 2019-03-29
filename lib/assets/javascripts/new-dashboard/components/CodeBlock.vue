<template>
  <textarea ref="code" v-model="code"></textarea>
</template>

<script>
import CodeMirror from 'codemirror';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/material.css';

export default {
  name: 'CodeBlock',
  data () {
    return {
      codemirror: null,
    }
  },
  mounted () {
    this.initialize();
  },
  beforeDestroy () {
    this.destroy();
  },
  props: {
    code: {
      type: String
    }
  },
  methods: {
    initialize () {
      this.codemirror = CodeMirror.fromTextArea(this.$refs.code, defaultOptions);
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
  mode: 'javascript',
  theme: 'material',
  readOnly: true,
  lineNumbers: true
};

</script>
<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

</style>
