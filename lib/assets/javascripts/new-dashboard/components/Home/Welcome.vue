<template>
  <WelcomeCompact :username="username"></WelcomeCompact>
</template>

<script>
import CreateButton from "new-dashboard/components/CreateButton.vue";
import WelcomeCompact from './WelcomeCompact';

export default {
  name: "Welcome",
  components: {
    CreateButton,
    WelcomeCompact
  },
  props: {
    username: String,
  },
};
</script>

<style scoped lang="scss">
@import "stylesheets/new-dashboard/variables";

.welcome {
  top: 64px;
  margin: auto;
  padding: 164px 0 120px;
  text-align: center;

  &__greeting {
    font-family: "Montserrat", sans-serif;
    font-size: 48px;
    font-weight: 600;
    line-height: 64px;
  }

  &__info {
    margin: 24px auto;
  }

  &__actions {
    display: flex;
    justify-content: center;
    text-transform: uppercase;

    .button {
      padding: 0;
      background: none;
      color: #047AE6;
      text-transform: uppercase;
    }
  }

  &.compact {
    position: relative;
    padding: 16px 0;
    text-align: initial;

    .welcome__greeting {
      display: inline-block;
      font-size: 16px;
      line-height: 24px;
    }

    .welcome__info {
      display: none;
    }

    .welcome__actions {
      display: inline-flex;
      justify-content: start;
    }
  }
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
    background-color: #74ffa8;
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
