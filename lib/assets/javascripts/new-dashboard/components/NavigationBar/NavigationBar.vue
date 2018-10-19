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
      <div class="navbar-avatar" v-bind:style="{ backgroundImage: `url('${user.avatar_url}')` }"></div>
  </div>
</nav>
</template>

<script>
export default {
  name: 'NavigationBar',
  props: {
    user: Object
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.navbar {
    width: 100%;
    padding: 0px 64px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: $primaryColor;
}

.navbar-elementsContainer {
    display: flex;
    align-items: center;
    margin: 0px;
    padding: 0;
}

.navbar-elementItem {
    padding: 20px 0px 16px 0px;
    margin-right: 34px;
    border-bottom: 4px solid transparent;
    display: flex;
    align-items: center;
    &.is-active {
        border-color: $white;
        .navbar-iconFill {
            fill: #fff;
        }
    }
}

.navbar-icon{
    margin-right: 8px;
}

.navbar-imagotype{
    position: absolute;
    height: 24px;
    width: 24px;
    margin-left: 50%;
    transform: translateX(-50%);
}

.navbar-search {
    margin: 0;
    input {
        width: 134px;
        height: 36px;
        background-color: #fff;
        border-radius: 18px;
        border: 0px;
        padding: 0 4px 0 38px;
        background-image: url("/img/icons/navbar/loupe.svg");
        background-repeat: no-repeat;
        background-position: 16px center;
        transition: width .3s cubic-bezier(.4,.01,.165,.99);
        &::placeholder {
            color: $textColor-light;
        }
        &:focus {
            width: 280px;
            outline: none;
        }
    }
}

.navbar-avatar {
    height: 36px;
    width: 36px;
    background-size: cover;
    overflow: hidden;
    background-color: $textColor-light;
    border-radius: 50%;
    display: flex;
    margin-left: 30px;
    &:hover{
        cursor: pointer;
    }
}
</style>
