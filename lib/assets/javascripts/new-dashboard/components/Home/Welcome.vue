<template>
  <div>
    <WelcomeFirst v-if="isFirst" :username="username"></WelcomeFirst>
    <WelcomeBasic v-if="!isFirst && !isCompact" :username="username" :notifications="notifications"></WelcomeBasic>
    <WelcomeCompact v-if="!isFirst && isCompact" :username="username"></WelcomeCompact>
  </div>
</template>

<script>
import CreateButton from 'new-dashboard/components/CreateButton.vue';
import WelcomeCompact from './WelcomeCompact';
import WelcomeFirst from './WelcomeFirst';
import WelcomeBasic from './WelcomeBasic';

export default {
  name: 'Welcome',
  components: {
    CreateButton,
    WelcomeBasic,
    WelcomeCompact,
    WelcomeFirst
  },
  computed: {
    isCompact () {
      // TODO: Implement this logic
      return false;
    },
    isFirst () {
      // TODO: Implement this logic
      return true;
    },
    username () {
      return this.$store.state.user.username;
    },
    notifications () {
      return this.$store.state.user.organizationNotifications;
    }
  }
};
</script>
