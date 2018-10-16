<template>
  <div id="app">
    <select v-model="selectedVisualization">
      <option v-for="visualization in visualizations" v-bind:value="visualization" v-bind:key="visualization.id">
        {{ visualization.name }}
      </option>
    </select>
    <button class="CDB-Button CDB-Button--primary" @click="openPrivacyModal">Change Visualization Privacy</button>
    <ul style="margin-top: 30px;">
      <li v-for="visualization in visualizations" v-bind:key="visualization.id" style="margin-bottom: 10px;">
        {{ visualization.name }} - {{ visualization.privacy }}
      </li>
    </ul>
    <button class="CDB-Button CDB-Button--primary" @click="openCreateModal">Create Dialog</button>
    <BackgroundPollingView ref="backgroundPollingView"/>
  </div>
</template>

<script>
import CreateDialog from './components/CreateDialog.vue'
import ChangePrivacy from './components/ChangePrivacy.vue'
import BackgroundPollingView from './components/BackgroundPollingView.vue'

export default {
  name: 'app',
  components: {
    BackgroundPollingView,
    ChangePrivacy,
    CreateDialog
  },
  data: () => ({
    selectedVisualization: null
  }),
  computed: {
    visualizations() {
      return this.$store.state.visualizations.data
    }
  },
  methods: {
    openPrivacyModal() {
      this.$modal.show({
        template: `
          <ChangePrivacy :visualization="visualization" v-on:close="$emit('close')"/>
        `,
        props: ['visualization'],
        components: {
          ChangePrivacy
        },
      },
      { visualization: this.selectedVisualization },
      { height: 'auto' })
    },
    openCreateModal() {
      this.$modal.show({
        template: `
          <CreateDialog :dialogType="dialogType" :backgroundPollingView="backgroundPollingView" v-on:close="$emit('close')"/>
        `,
        props: ['dialogType', 'backgroundPollingView'],
        components: {
          CreateDialog,
        },
      },
      {
        dialogType: 'maps',
        backgroundPollingView: this.$refs.backgroundPollingView.getBackgroundPollingView()
      },
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

.v--modal-overlay .v--modal-box {
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  overflow: scroll !important;
}
</style>
