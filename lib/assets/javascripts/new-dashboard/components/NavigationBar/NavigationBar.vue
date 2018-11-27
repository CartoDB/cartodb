<template>
<nav class="navbar" :class="{ 'is-search-open': isSearchOpen }">
  <ul class="navbar-elementsContainer">
      <router-link :to="{ name: 'maps' }" class="navbar-elementItem" active-class="is-active">
        <span class="navbar-icon">
          <img svg-inline class="navbar-iconFill" src="../../assets/icons/navbar/maps.svg" />
        </span>
        <span class="title is-caption is-txtWhite u-hideTablet">Maps</span>
      </router-link>
      <router-link :to="{ name: 'solutions' }" class="navbar-elementItem" active-class="is-active">
        <span class="navbar-icon">
          <img svg-inline class="navbar-iconFill" src="../../assets/icons/navbar/solutions.svg" />
        </span>
        <span class="title is-caption is-txtWhite u-hideTablet">Solutions</span>
      </router-link>
      <router-link :to="{ name: 'datasets' }" class="navbar-elementItem" active-class="is-active">
        <span class="navbar-icon">
          <img svg-inline class="navbar-iconFill" src="../../assets/icons/navbar/data.svg" />
        </span>
        <span class="title is-caption is-txtWhite u-hideTablet">Data</span>
      </router-link>
      <span class="navbar-elementItem navbar-icon navbar-searchIcon u-showMobile" @click="toggleSearch">
        <img svg-inline src="../../assets/icons/navbar/loupe_white.svg" />
      </span>
  </ul>
  <div class="navbar-imagotype u-hideMobile">
      <img src="../../assets/icons/navbar/imagotype.svg" />
  </div>
  <div class="navbar-elementsContainer navbar-searchContainer">
      <form action="#" method="get" class="navbar-search" autocomplete="off">
          <input type="text" name="query" class="title is-small is-regular navbar-searchInput" placeholder="Search">
      </form>
      <div class="navbar-user">
        <div class="navbar-avatar" :class="{'has-notification': notificationsCount}" :style="{ backgroundImage: `url('${user.avatar_url}')` }" @click.stop.prevent="toggleDropdown"></div>
        <UserDropdown :userModel="user" :notificationsCount="notificationsCount" :open="isDropdownOpen" :baseUrl="baseUrl" v-click-outside="closeDropdown" @linkClick="closeDropdown" />
      </div>
      <span class="navbar-searchClose" @click="toggleSearch">
        <img svg-inline src="../../assets/icons/navbar/close.svg" />
      </span>
  </div>
</nav>
</template>

<script>
import UserDropdown from './UserDropdown';

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
      console.log('closeDropdown');
      this.isDropdownOpen = false;
    },

    toggleSearch () {
      this.isSearchOpen = !this.isSearchOpen;
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
  position: relative;

  a:last-of-type {
    margin-right: 0;
  }

  @media (max-width: $layout-mobile) {
    a:last-of-type {
      margin-right: 36px;
    }
  }
}

.navbar-elementItem {
  display: flex;
  align-items: center;
  margin-right: 54px;
  padding: 20px 2px 16px;
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

.navbar-searchIcon {
  padding-top: 21px;
}

.navbar-searchClose {
  display: none;
}

.navbar-icon {
  margin-right: 12px;

  @media (max-width: $layout-tablet) {
    margin-right: 0;
  }
}

.navbar-imagotype {
  width: 24px;
  height: 24px;
}

.navbar-search {
  @media (max-width: $layout-mobile) {
    visibility: hidden;
    opacity: 0;
  }

  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 16px;
    width: 18px;
    height: 18px;
    transform: translate3d(0, -50%, 0);
    background-image: url("../../assets/icons/navbar/loupe.svg");
    background-repeat: no-repeat;
    background-position: center;
  }

  &:hover {
    &::after {
      background-image: url("../../assets/icons/navbar/loupe_primary.svg");
    }

    .navbar-searchInput {
      &::placeholder {
        color: $primary-color;
      }

      &:focus {
        &::placeholder {
          color: $text-secondary-color;
        }
      }
    }
  }

  &:focus-within {
    &::after {
      background-image: url("../../assets/icons/navbar/loupe.svg");
    }
  }
}

.navbar-searchInput {
  width: 120px;
  height: 36px;
  padding-left: 42px;
  transition: width 0.3s cubic-bezier(0.4, 0.01, 0.165, 0.99);
  border: 0;
  border-radius: 18px;
  background-color: #FFF;

  &::placeholder {
    color: $text-secondary-color;
  }

  &:focus {
    width: 240px;
    outline: none;
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
  padding: 0;

  .navbar-elementsContainer {
    align-items: center;
  }

  .navbar-elementsContainer,
  .navbar-imagotype,
  .navbar-user {
    visibility: hidden;
    opacity: 0;
  }

  .navbar-searchContainer {
    visibility: visible;
    position: absolute;
    width: 100%;
    opacity: 1;
  }

  .navbar-search {
    visibility: visible;
    position: absolute;
    left: 0;
    width: calc(100% - 66px);
    margin-left: 16px;
    opacity: 1;

    &::after {
      display: none;
    }
  }

  .navbar-searchInput {
    width: 100%;
    padding: 16px;
    border-radius: 3px;
    background-image: none;
  }

  .navbar-searchClose {
    display: block;
    position: absolute;
    right: 16px;
  }
}
</style>
