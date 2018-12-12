<template>
  <div class="create-map-card">
    <img src="../../../assets/icons/maps/initialState.svg" alt>
    <h3 class="title is-body">{{headerText}}</h3>
    <p class="text is-caption">{{infoText}}</p>
    <CreateButton visualizationType="maps">{{ buttonText}}</CreateButton>
  </div>
</template>

<script>
import CreateButton from 'new-dashboard/components/CreateButton.vue';

export default {
  name: 'CreateMapCard',
  components: {
    CreateButton
  },
  computed: {
    headerText () {
      return 'Create your first map to predict key insights';
    },
    infoText () {
      return 'Build your first Location Intelligence anañysis or take a look to our guides and help.';
    },
    buttonText () {
      return 'Create your first Map';
    }
  }
};
</script>

<style scoped lang="scss">
@import "stylesheets/new-dashboard/variables";

.create-map-card {
  padding: 36px 24px;
  border: 2px dashed #e6e8eb;
  text-align: center;

  img {
    margin-bottom: 40px;
  }

  h3 {
    margin: 16px auto;
  }

  button {
    margin: 36px auto 0;
  }
}
</style>
