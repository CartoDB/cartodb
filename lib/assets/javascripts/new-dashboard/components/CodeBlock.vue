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
  mounted () {
    this.initialize();
  },
  props: {
    code: {
      type: String
    }
  },
  methods: {
    initialize () {
      CodeMirror.fromTextArea(this.$refs.code, defaultOptions);
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
