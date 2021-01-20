<template>
  <div ref="viewer"></div>
</template>

<script>

import init from '@carto/viewer/src/init';
import { mapState } from 'vuex';

export default {
  name: 'TilesetsViewer',
  components: {},
  props: {},
  data () {
    return {};
  },
  computed: {
    ...mapState({
      apiKey: state => state.user.api_key,
      username: state => state.user.username
    })
  },
  mounted () {
    const element = this.$refs.viewer;
    const props = {
      username: this.username,
      type: 'bigquery',
      query: new URLSearchParams(`?data=${this.$route.params.id}${this.getApiKeyParam()}`)
    };
    init(element, props);
  },
  methods: {
    getApiKeyParam () {
      // return `&api_key=${this.apiKey}`;
      return '&api_key=default_public';
    }
  }
};
</script>

<style scoped lang="scss">
@import "new-dashboard/styles/variables";
</style>
