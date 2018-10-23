<template>
<nav class="navbar">
  <ul class="navbar-elementsContainer">
      <router-link :to="{ name: 'home' }" class="navbar-elementItem" exact-active-class="is-active">
        <span class="navbar-icon">
          <img svg-inline class="navbar-iconFill" src="../../assets/icons/navbar/home.svg" />
        </span>
        <span class="title is-caption is-regular is-txtWhite">Home</span>
      </router-link>
      <router-link :to="{ name: 'solutions' }" class="navbar-elementItem" exact-active-class="is-active">
        <span class="navbar-icon">
          <img svg-inline class="navbar-iconFill" src="../../assets/icons/navbar/solutions.svg" />
        </span>
        <span class="title is-caption is-regular is-txtWhite">Solutions</span>
      </router-link>
      <router-link :to="{ name: 'maps' }" class="navbar-elementItem" exact-active-class="is-active">
        <span class="navbar-icon">
          <img svg-inline class="navbar-iconFill" src="../../assets/icons/navbar/applications.svg" />
        </span>
        <span class="title is-caption is-regular is-txtWhite">Maps</span>
      </router-link>
      <router-link :to="{ name: 'data' }" class="navbar-elementItem" exact-active-class="is-active">
        <span class="navbar-icon">
          <img svg-inline class="navbar-iconFill" src="../../assets/icons/navbar/data.svg" />
        </span>
        <span class="title is-caption is-regular is-txtWhite">Data</span>
      </router-link>
  </ul>
  <div class="navbar-imagotype">
      <img src="../../assets/icons/navbar/imagotype.svg" />
  </div>
  <div class="navbar-elementsContainer">
      <form action="#" method="get" class="navbar-search">
          <input type="text" name="query" class="title is-small is-regular" placeholder="Search">
      </form>
      <div class="navbar-user">
        <div class="navbar-avatar" v-bind:style="{ backgroundImage: `url('${user.avatar_url}')` }" @click.stop.prevent="toggleDropdown"></div>
        <UserDropdown ref="userDropdown" :userModel="userModel" :configModel="configModel"/>
      </div>
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
    userModel: Object,
    configModel: Object
  },
  data () {
    return {
      isDropdownOpen: false
    };
  },
  methods: {
    toggleDropdown () {
      this.$refs.userDropdown.toggle();
    }
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
@import 'stylesheets/new-dashboard/variables';

.navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0 64px;
  background-color: $primaryColor;
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
  margin-right: 34px;
  padding: 20px 0 16px;
  border-bottom: 4px solid transparent;

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

.navbar-icon {
  margin-right: 8px;
}

.navbar-imagotype {
  position: absolute;
  left: 50%;
  width: 24px;
  height: 24px;
  transform: translateX(-50%);
}

.navbar-search {
  margin: 0;

  input {
    width: 134px;
    height: 36px;
    padding: 0 4px 0 38px;
    transition: width 0.3s cubic-bezier(0.4, 0.01, 0.165, 0.99);
    border: 0;
    border-radius: 18px;
    background-color: #FFF;
    background-image: url("../../assets/icons/navbar/loupe.svg");
    background-repeat: no-repeat;
    background-position: 16px center;

    &::placeholder {
      color: $textColor-light;
    }

    &:focus {
      width: 280px;
      outline: none;
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
  margin-left: 30px;
  overflow: hidden;
  border-radius: 50%;
  background-color: $textColor-light;
  background-size: cover;

  &:hover {
    cursor: pointer;
  }
}
</style>
