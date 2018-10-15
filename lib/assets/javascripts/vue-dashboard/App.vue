<template>
  <div id="app">
    <select v-model="selectedVisualization">
      <option v-for="visualization in visualizations" v-bind:value="visualization" v-bind:key="visualization.id">
        {{ visualization.name }}
      </option>
    </select>
    <button @click="openPrivacyModal">Change Visualization Privacy</button>
    <ul style="margin-top: 30px;">
      <li v-for="visualization in visualizations" v-bind:key="visualization.id" style="margin-bottom: 10px;">
        {{ visualization.name }} - {{ visualization.privacy }}
      </li>
    </ul>
  </div>
</template>

<script>
// import CreateDialog from './components/CreateDialog.vue'
import ChangePrivacy from './components/ChangePrivacy.vue'

export default {
  name: 'app',
  components: {
    // CreateDialog,
    ChangePrivacy
  },
  data: () => ({
    selectedVisualization: null
  }),
  created: function() {
    // this.$store.dispatch('getVisualizations');
  },
  computed: {
    visualizations() {
      return this.$store.state.visualizations.data
    }
  },
  methods: {
    openPrivacyModal() {
      debugger;
      this.$modal.show({
        template: `
          <ChangePrivacy :visualization="visualization" v-on:close="$emit('close')"/>
        `,
        props: ['visualization'],
        components: {
          // CreateDialog,
          ChangePrivacy
        },
      },
      { visualization: this.selectedVisualization },
      { height: 'auto' })
    }
  }
}
</script>

<style>
#app {
  width: 100vw;
  height: 100vh;
}
</style>
