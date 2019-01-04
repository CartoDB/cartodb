<template>
  <section class="welcome-first">
    <div class="container">
      <div class="welcome-first__greeting title is-title">{{ greeting }}</div>
      <div class="welcome-first__text text is-caption">{{ text }}</div>
      <div class="welcome-first__actions">
        <CreateButton visualizationType="map" v-if="!isOrganizationAdmin">{{ $t(`MapsPage.createMap`) }}</CreateButton>
        <CreateButton visualizationType="map" v-if="!isOrganizationAdmin">{{ $t(`DataPage.createDataset`) }}</CreateButton>
        <a class="button button--small is-primary"
          :href="`mailto:${organizationMail}`"
          v-if="isOrganizationUser && !isOrganizationAdmin">
          {{ $t('HomePage.WelcomeSection.firstTime.contactOrganizationAdmin') }}
        </a>
        <a class="button button--small is-primary"
          :href="`${ baseUrl }/organization`"
          v-if="isOrganizationAdmin">
          {{ $t('HomePage.WelcomeSection.firstTime.manageOrganization') }}
        </a>
      </div>
    </div>
  </section>
</template>

<script>
import CreateButton from 'new-dashboard/components/CreateButton.vue';

export default {
  name: 'WelcomeFirst',
  components: {
    CreateButton
  },
  props: {
    username: String,
    userType: String
  },
  computed: {
    greeting () {
      return this.$t('HomePage.WelcomeSection.greeting', {username: this.$props.username});
    },
    text () {
      const organizationName = this.$store.state.user.organization && this.$store.state.user.organization.name;

      const firstTimeMessage = this.$t('HomePage.WelcomeSection.firstTime.message');
      const planMessage = this.$t(`HomePage.WelcomeSection.firstTime.planMessage.${this.userType}`, {
        organizationName
      });

      return `${firstTimeMessage} ${planMessage}`;
    },
    baseUrl () {
      return this.$store.state.user.base_url;
    },
    isOrganizationAdmin () {
      return this.userType === 'organizationAdmin';
    },
    isOrganizationUser () {
      return this.userType === 'organizationUser';
    },
    organizationMail () {
      const organization = this.$store.state.user.organization;
      return organization.admin_email;
    }
  }
};
</script>

<style scoped lang="scss">
@import "stylesheets/new-dashboard/variables";

.welcome-first {
  position: relative;
  padding: 124px 0;
  background: $primary-color;
  color: $white;
  text-align: center;

  &__text {
    max-width: 724px;
    margin: 16px auto 48px;
  }

  &__actions {
    display: flex;
    justify-content: center;
  }

  .button {
    border: 1px solid $white;
    background: none;
    color: $white;
    text-transform: uppercase;

    &:not(:last-child) {
      margin-right: 36px;
    }
  }
}
</style>
