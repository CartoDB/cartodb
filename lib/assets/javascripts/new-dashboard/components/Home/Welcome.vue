<template>
  <section>
    <div class="welcome-navbar" v-if="isRest" :class="{'is-rest': isRest}">
      <h4 class="title is-caption is-semibold welcome-title">
        {{ $t(`HomePage.welcome.${section}.title`, { username: user.username }) }}
      </h4>
      <ul class="welcome-actions">
        <li class="welcome-action"><CreateButton visualizationType="map">{{ $t(`MapsPage.createMap`) }}</CreateButton></li>
        <li class="welcome-action"><CreateButton visualizationType="map">{{ $t(`DataPage.createDataset`) }}</CreateButton></li>
      </ul>
    </div>

    <div v-if="!isRest" class="welcome-section"  :class="{'is-first': isFirst, 'has-notification': hasNotification}">
      <div class="container grid u-flex u-justifyCenter" v-if="section !== 'rest'">
        <div class="grid-cell grid-cell--col9">
          <h1 class="welcome-title title is-title" :class="{'is-txtWhite': isFirst}">
            {{ $t(`HomePage.welcome.${section}.title`, { username: user.username }) }}
          </h1>
          <h3 class="welcome-text text is-body"  :class="{'is-txtWhite': isFirst}">
            {{ $t(`HomePage.welcome.${section}.text`, { account: user.account_type_display_name, organization: user.organization.name, owner: user.organization.owner.username }) }}
          </h3>
          <ul class="welcome-actions" v-if="isFirst">
            <li class="welcome-action"><CreateButton visualizationType="map">{{ $t(`MapsPage.createMap`) }}</CreateButton></li>
            <li class="welcome-action"><CreateButton visualizationType="map">{{ $t(`DataPage.createDataset`) }}</CreateButton></li>
          </ul>
          <ul class="welcome-actions"  v-if="!isFirst">
            <li class="welcome-action">
              <router-link :to="{name: 'notifications'}">
                  <button class="button button--small is-primary">{{ $t(`HomePage.welcome.${section}.button`) }}</button>
              </router-link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import CreateButton from 'new-dashboard/components/CreateButton.vue';

export default {
  name: 'Welcome',
  components: {
    CreateButton
  },
  props: {
    user: Object,
    isFirst: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    hasNotification () {
      return this.user.organizationNotifications.length > 0;
    },
    isRest () {
      return !(this.isFirst || this.hasNotification);
    },
    section () {
      if (this.isFirst) {
        return 'first';
      }
      if (this.hasNotification) {
        return 'notification';
      }
      return 'rest';
    }
  }
};
</script>

<style scoped lang="scss">
@import 'stylesheets/new-dashboard/variables';

.welcome-section {
  padding: 164px 0 120px;
}

.welcome-title {
  margin-top: 64px;
  text-align: center;
}

.welcome-text {
  margin-top: 16px;
  text-align: center;
}

.welcome-actions {
  display: flex;
  justify-content: center;
  margin-top: 36px;
}

.welcome-action {
  &:not(:last-child) {
    margin-right: 36px;
  }
}

.welcome-navbar {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 76px 64px 12px 250px;

  @media (max-width: $layout-tablet) {
    padding: 84px 24px 20px 40px;
  }

  @media (max-width: $layout-mobile) {
    padding: 84px 16px 20px 20px;
  }
}

.is-first {
  background-color: $primary-color;

  .button {
    border: 1px solid white;
  }
}

.has-notification {
  .welcome-title::after {
    content: "";
    position: absolute;
    width: 11px;
    height: 11px;
    border-radius: 50%;
    background-color: #74FFA8;
  }
}

.is-rest {
  .welcome-title {
    margin-top: 0;
    margin-right: 52px;

    @media (max-width: $layout-tablet) {
      margin-right: 32px;
    }
  }

  .welcome-actions {
    margin-top: 0;
  }

  .welcome-action {
    margin-right: 20px;

    @media (max-width: $layout-tablet) {
      margin-right: 12px;
    }
  }

  .button {
    background-color: $white;
    color: $primary-color;
  }
}
</style>
