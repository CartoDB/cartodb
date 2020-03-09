<template>
  <iframe ref="iframe" frameborder="0" :height="height" :width="width"></iframe>
</template>

<script>
export default {
  name: 'InjectableIframe',
  mounted () {
    this.setContent();
  },
  props: {
    content: String,
    height: String,
    width: String
  },
  methods: {
    setContent () {
      const docIframe = this.$refs.iframe.contentWindow.document;
      docIframe.open('text/html', 'replace');
      docIframe.write(this.content);
      docIframe.close();
    }
  },
  watch: {
    content () {
      this.setContent();
    }
  }
};
</script>
