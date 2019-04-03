<template>
  <iframe ref="iframe" src="" frameborder="0" height="height" width="width"></iframe>
</template>

<script>

export default {
  name: 'InjectableIframe',
  mounted () {
    this.initialize();
  },
  props: {
    content: String,
    height: String,
    width: String
  },
  methods: {
    initialize () {
      const docIframe = this.$refs.iframe.contentWindow.document;
      docIframe.open();
      docIframe.write(this.content);
      docIframe.close();
    }
  }
};
</script>

