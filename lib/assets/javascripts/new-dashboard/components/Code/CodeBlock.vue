<template>
  <textarea ref="code" :placeholder="placeholder"></textarea>
</template>

<script>
import CodeMirror from 'codemirror';
import 'codemirror/mode/javascript/javascript';
import 'codemirror/mode/python/python';
import 'codemirror/mode/shell/shell';
import 'codemirror/mode/sql/sql';
import 'codemirror/mode/htmlmixed/htmlmixed';

export default {
  name: 'CodeBlock',
  data () {
    return {
      codemirror: null
    };
  },
  model: {
    prop: 'code',
    event: 'inputChange'
  },
  mounted () {
    this.initialize();
  },
  beforeDestroy () {
    this.destroy();
  },
  props: {
    code: {
      type: String,
      default: ''
    },
    placeholder: String,
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
    },
    readOnly: {
      type: Boolean,
      default: true
    }
  },
  methods: {
    onInputChange (e) {
      this.$emit('inputChange', e.getValue());
    },
    initialize () {
      const allOptions = {
        mode: this.language,
        lineNumbers: this.lineNumbers,
        theme: this.theme,
        readOnly: this.readOnly,
        ...defaultOptions
      };
      this.codemirror = CodeMirror.fromTextArea(this.$refs.code, allOptions);
      if (this.code) {
        this.codemirror.setValue(this.code);
      }
      this.codemirror.on('change', this.onInputChange);
    },
    destroy () {
      const codemirrorElement = this.codemirror.doc.cm.getWrapperElement();
      codemirrorElement.remove && codemirrorElement.remove();
    }
  }
};

const defaultOptions = {
  addModeClass: true,
  lineWrapping: true
};

</script>

<style lang="scss" scoped>
  @import '../../styles/vendors/_codemirror.scss';
</style>
