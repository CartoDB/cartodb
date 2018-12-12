<template>
<main class="app-main">
  <Welcome></Welcome>
  <MapsSection></MapsSection>
</main>
</template>

<script>
import Welcome from './WelcomeSection/Welcome.vue';
import MapsSection from './MapsSection/MapsSection.vue';

export default {
  name: 'Home',
  components: {
    Welcome,
    MapsSection
  }
};
</script>

<style scoped lang="scss">
@import 'stylesheets/new-dashboard/variables';

.app-main {
  position: relative;
  top: 64px;
}
</style>
