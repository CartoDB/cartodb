<template>
<section class="page page--welcome">
  <Welcome></Welcome>
  <MapsSection></MapsSection>
</section>
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

.page--welcome {
  padding: 0;
}
</style>
