<template>
<nav class="navbar" :class="{ 'is-search-open': isSearchOpen }">
  <ul class="navbar-elementsContainer">
      <router-link :to="{ name: 'maps' }" class="navbar-elementItem" active-class="is-active">
        <span class="navbar-icon">
          <img svg-inline class="navbar-iconFill" src="../../assets/icons/navbar/applications.svg" />
        </span>
        <span class="title is-caption is-txtWhite u-hideOnTablet">Maps</span>
      </router-link>
      <router-link :to="{ name: 'solutions' }" class="navbar-elementItem" active-class="is-active">
        <span class="navbar-icon">
          <img svg-inline class="navbar-iconFill" src="../../assets/icons/navbar/solutions.svg" />
        </span>
        <span class="title is-caption is-txtWhite u-hideOnTablet">Solutions</span>
      </router-link>
      <router-link :to="{ name: 'datasets' }" class="navbar-elementItem" active-class="is-active">
        <span class="navbar-icon">
          <img svg-inline class="navbar-iconFill" src="../../assets/icons/navbar/data.svg" />
        </span>
        <span class="title is-caption is-txtWhite u-hideOnTablet">Data</span>
      </router-link>
      <span class="navbar-elementItem navbar-icon u-showOnMobile" @click="toggleSearch">
        <img svg-inline src="../../assets/icons/navbar/loupe_white.svg" />
      </span>
  </ul>
  <div class="navbar-imagotype u-hideOnMobile">
      <img src="../../assets/icons/navbar/imagotype.svg" />
  </div>
  <div class="navbar-elementsContainer navbar-searchContainer">
      <form action="#" method="get" class="navbar-search">
          <input type="text" name="query" class="title is-small is-regular navbar-searchInput" placeholder="Search">
      </form>
      <div class="navbar-user">
        <div class="navbar-avatar" :class="{'has-notification': notificationsCount}" :style="{ backgroundImage: `url('${user.avatar_url}')` }" @click.stop.prevent="toggleDropdown"></div>
        <UserDropdown :userModel="user" :notificationsCount="notificationsCount" :open="isDropdownOpen" :baseUrl="baseUrl" v-click-outside="closeDropdown"/>
      </div>
      <span class="navbar-searchClose" @click="toggleSearch">
        <img svg-inline src="../../assets/icons/navbar/close.svg" />
      </span>
  </div>
</nav>
</template>

<script>
import UserDropdown from './UserDropdown';
import { Number } from 'core-js';

export default {
  name: 'NavigationBar',
  components: {
    UserDropdown
  },
  props: {
    user: Object,
    baseUrl: String,
    notificationsCount: Number
  },
  data () {
    return {
      isDropdownOpen: false,
      isSearchOpen: false
    };
  },
  methods: {
    toggleDropdown () {
      this.isDropdownOpen = !this.isDropdownOpen;
    },

    closeDropdown () {
      this.isDropdownOpen = false;
    },

    toggleSearch () {
      this.isSearchOpen = !this.isSearchOpen;
    }
  },
  directives: {
    clickOutside: {
      bind: function (el, binding, vnode) {
        el.clickOutsideEvent = function (event) {
          if (!(el === event.target || el.contains(event.target))) {
            vnode.context[binding.expression](event);
          }
        };
        document.body.addEventListener('click', el.clickOutsideEvent);
      },
      unbind: function (el) {
        document.body.removeEventListener('click', el.clickOutsideEvent);
      }
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
@import 'stylesheets/new-dashboard/variables';

.navbar {
  display: flex;
  position: fixed;
  z-index: 3;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0 64px;
  background-color: $primary-color;

  @media (max-width: $layout-tablet) {
    padding: 0 24px 0 40px;
  }

  @media (max-width: $layout-mobile) {
    padding: 0 16px 0 20px;
  }

}

.navbar-elementsContainer {
  display: flex;
  align-items: center;
  margin: 0;
  padding: 0;
}

.navbar-elementItem {
  display: flex;
  align-items: center;
  margin-right: 54px;
  padding: 20px 0 16px;
  border-bottom: 4px solid transparent;

  @media (max-width: $layout-tablet) {
    margin-right: 48px;
  }

  @media (max-width: $layout-mobile) {
    margin-right: 36px;
  }

  &.is-active {
    border-color: $white;

    .navbar-iconFill {
      fill: #FFF;
    }

    .navbar-iconNegativeFill {
      fill: transparent;
    }
  }
}

.navbar-searchClose {
  display: none;
}

.navbar-icon {
  margin-right: 8px;
    @media (max-width: $layout-tablet) {
      margin-right: 0;
  }
}

.navbar-imagotype {
  position: absolute;
  left: 50%;
  width: 24px;
  height: 24px;
  transform: translateX(-50%);
}

.navbar-search {
  @media (max-width: $layout-mobile) {
    visibility: hidden;
    opacity: 0;
  }

  .navbar-searchInput {
    width: 120px;
    height: 36px;
    padding-left: 42px;
    transition: width 0.3s cubic-bezier(0.4, 0.01, 0.165, 0.99);
    border: 0;
    border-radius: 18px;
    background-color: #FFF;
    background-image: url("../../assets/icons/navbar/loupe.svg");
    background-repeat: no-repeat;
    background-position: 16px center;

    &::placeholder {
      color: $text-secondary-color;
    }

    &:focus {
      width: 280px;
      outline: none;
    }
  }

  &:hover {
    .navbar-searchInput {
      background-image: url("../../assets/icons/navbar/loupe_primary.svg");

      &::placeholder {
        color: $primary-color;
      }

      &:focus {
        background-image: url("../../assets/icons/navbar/loupe.svg");
        &::placeholder {
          color: $text-secondary-color;
        }
      }

      &:focus-within {
        background-color:  #FFF;
      }
    }
  }
}

.navbar-user {
  position: relative;
}

.navbar-avatar {
  display: flex;
  width: 36px;
  height: 36px;
  margin-left: 24px;
  overflow: hidden;
  border-radius: 50%;
  background-color: $text-color-light;
  background-size: cover;

  &.has-notification {
    &::after {
      content: "";
      position: absolute;
      top: -4px;
      right: -4px;
      width: 12px;
      height: 12px;
      border: 2px solid $primary-color;
      border-radius: 50%;
      background-color: $notification;
    }
  }

  &:hover {
    cursor: pointer;
  }
}

.navbar.is-search-open {
  .navbar-elementsContainer,
  .navbar-imagotype,
  .navbar-user {
    visibility: hidden;
    opacity: 0;
  }

  .navbar-searchContainer {
    visibility: visible;
    opacity: 1;
    .navbar-search {
      position: absolute;
      width: calc(100% - 66px);
      left: 0;
      margin-left: 16px;
      visibility: visible;
      opacity: 1;
      .navbar-searchInput {
        width: 100%;
        background-image: none;
        border-radius: 3px;
        padding: 16px;
      }
    }
    .navbar-searchClose {
      display: block;
      position: absolute;
      right: 16px;
    }
  }

}
</style>
