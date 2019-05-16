<template>
<nav class="navbar" :class="{ 'is-search-open': isSearchOpen, 'is-user-notification': isNotificationVisible }">
  <ul class="navbar-elementsContainer">
      <router-link :to="{ name: 'home' }" class="navbar-elementItem" :class="{'is-active': isHomePage()}" staticRoute="/dashboard">
        <span class="navbar-icon">
          <img svg-inline class="navbar-iconFill" src="../../assets/icons/navbar/home.svg" />
        </span>
        <span class="title is-caption is-txtWhite u-hideTablet">Home</span>
      </router-link>
      <router-link :to="{ name: 'maps' }" class="navbar-elementItem" active-class="is-active" staticRoute="/dashboard/maps">
        <span class="navbar-icon">
          <img svg-inline class="navbar-iconFill" src="../../assets/icons/navbar/maps.svg" />
        </span>
        <span class="title is-caption is-txtWhite u-hideTablet">Maps</span>
      </router-link>
      <!-- <router-link :to="{ name: 'solutions' }" class="navbar-elementItem" active-class="is-active">
        <span class="navbar-icon">
          <img svg-inline class="navbar-iconFill" src="../../assets/icons/navbar/solutions.svg" />
        </span>
        <span class="title is-caption is-txtWhite u-hideTablet">Solutions</span>
      </router-link> -->
      <router-link :to="{ name: 'datasets' }" class="navbar-elementItem" active-class="is-active" staticRoute="/dashboard/datasets">
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
      <Search />
      <div class="navbar-user">
        <div class="navbar-avatar" :class="{'has-notification': notificationsCount}" :style="{ backgroundImage: `url('${user.avatar_url}')` }" @click.stop.prevent="toggleDropdown"></div>
        <UserDropdown :userModel="user" :notificationsCount="notificationsCount" :open="isDropdownOpen" :baseUrl="baseUrl" v-click-outside="closeDropdown" @linkClick="closeDropdown" />
        <FeedbackPopup class="feedback-popup" v-if="shouldShowFeedbackPopup" @feedbackClick="onFeedbackClicked"/>
      </div>
      <span class="navbar-searchClose" @click="toggleSearch">
        <img svg-inline src="../../assets/icons/navbar/close.svg" />
      </span>
  </div>
</nav>
</template>

<script>
import Search from '../Search/Search';
import UserDropdown from './UserDropdown';
import FeedbackPopup from '../FeedbackPopup';
import storageAvailable from 'new-dashboard/utils/is-storage-available';

export default {
  name: 'NavigationBar',
  components: {
    Search,
    UserDropdown,
    FeedbackPopup
  },
  props: {
    user: Object,
    baseUrl: String,
    notificationsCount: Number,
    isNotificationVisible: Boolean,
    isFirstTimeInDashboard: Boolean,
    bundleType: {
      type: String,
      default: 'other'
    }
  },
  data () {
    return {
      isDropdownOpen: false,
      isSearchOpen: false,
      hasDropdownOpenedForFirstTime: false
    };
  },
  computed: {
    isDashboardBundle () {
      return this.$props.bundleType === 'dashboard';
    },
    popupWasShown () {
      if (!storageAvailable('localStorage')) {
        return true;
      }

      return JSON.parse(window.localStorage.getItem('carto.feedback.popupWasShown'));
    },
    shouldShowFeedbackPopup () {
      return this.isDashboardBundle &&
        !this.isFirstTimeInDashboard &&
        !this.hasDropdownOpenedForFirstTime &&
        !this.popupWasShown;
    }
  },
  methods: {
    toggleDropdown () {
      this.hasDropdownOpenedForFirstTime = true;
      this.isDropdownOpen = !this.isDropdownOpen;
    },
    closeDropdown () {
      this.isDropdownOpen = false;
    },
    toggleSearch () {
      this.isSearchOpen = !this.isSearchOpen;
    },
    isHomePage () {
      return (this.$route || {}).name === 'home';
    },
    onFeedbackClicked () {
      this.toggleDropdown();
    }
  }
};
</script>

<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.navbar {
  display: flex;
  position: fixed;
  z-index: $z-index__navbar;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0 64px;
  border-bottom: 1px solid $white;
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
  cursor: pointer;
}

.navbar-searchClose {
  display: none;
  cursor: pointer;
}

.navbar-icon {
  margin-right: 12px;

  @media (max-width: $layout-tablet) {
    margin-right: 0;
  }
}

.navbar-imagotype {
  position: absolute;
  left: 50%;
  width: 24px;
  height: 24px;
  transform: translate3d(-50%, 0, 0);
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
  background-color: $navbar-avatar__bg-color;
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
      background-color: $notification__bg-color;
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

  .navbar-searchClose {
    display: block;
    position: absolute;
    right: 16px;
  }
}

.navbar.is-user-notification {
  margin-top: $notification-warning__height;
}

.feedback-popup {
  position: absolute;
  top: calc(100% + 18px);
  right: 0;
}
</style>
