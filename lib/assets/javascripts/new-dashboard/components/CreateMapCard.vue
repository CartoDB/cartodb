<template>
  <InitialState :title="headerText">
    <template slot="icon">
      <img svg-inline src="../assets/icons/maps/initialState.svg">
    </template>
    <template slot="description">
      <p class="text is-caption is-txtGrey" v-html="infoText"></p>
    </template>
    <template slot="actionButton">
      <CreateButton visualizationType="maps" :disabled="!canCreateMaps">{{ buttonText }}</CreateButton>
    </template>
  </InitialState>
</template>

<script>
import CreateButton from 'new-dashboard/components/CreateButton.vue';
import InitialState from 'new-dashboard/components/States/InitialState';

export default {
  name: 'CreateMapCard',
  components: {
    CreateButton,
    InitialState
  },
  computed: {
    headerText () {
      return this.$t(`MapsPage.zeroCase.title`);
    },
    infoText () {
      return this.$t(`MapsPage.zeroCase.description`);
    },
    buttonText () {
      return this.$t(`MapsPage.zeroCase.createMap`);
    },
    canCreateMaps () {
      return this.$store.getters['user/canCreateMaps'];
    }
  }
};
</script>
