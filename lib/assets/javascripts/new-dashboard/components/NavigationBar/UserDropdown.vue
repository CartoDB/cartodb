<template>
  <div v-if="open" class="navbar-dropdown" >
    <ul class="navbar-dropdown-container">
      <li class="navbar-dropdown-profile">
        <div class="avatar-container">
          <img :src="userModel.attributes.avatar_url">
        </div>
        <div class="navbar-dropdown-userInfo">
          <p class="text is-semibold is-caption">{{userModel.attributes.username}}</p>
          <p class="text is-small">{{userModel.attributes.email}}</p>
        </div>
      </li>
      <li class="navbar-dropdown-iconLink">
        <div class="icon-container">
          <img src="../../assets/icons/navbar/dropdown/settings.svg"/>
        </div>
        <a href="/profile" class="text is-semibold is-caption is-txtGrey">Settings</a>
      </li>
      <li class="navbar-dropdown-iconLink">
        <div class="icon-container">
          <img src="../../assets/icons/navbar/dropdown/api-keys.svg"/>
        </div>
        <a href="/your_apps" class="text is-semibold is-caption is-txtGrey">API Keys &amp; OAuth</a>
      </li>
      <li class="navbar-dropdown-iconLink">
        <div class="icon-container">
          <img src="../../assets/icons/navbar/dropdown/profile.svg"/>
        </div>
        <a href="/me" class="text is-semibold is-caption is-txtGrey">Public Profile</a>
      </li>
      <li class="navbar-dropdown-iconLink">
        <div class="icon-container">
          <img src="../../assets/icons/navbar/dropdown/notifications.svg"/>
        </div>
        <a href="#" class="text is-semibold is-caption is-txtGrey">Notifications</a>
        <span v-if="notifications > 0" class="notification-number text is-semibold is-small is-txtGrey">{{notifications}}</span>
      </li>
    </ul>
    <div class="navbar-dropdown-bottom">
      <a href="/logout" class="text is-semibold is-caption is-txtGrey">Logout</a>
    </div>
  </div>
</template>

<script>
export default {
  name: 'UserDropdown',
  props: {
    configModel: Object,
    open: { type: Boolean, default: true },
    userModel: Object,
    notifications: Number
  },
  watch: {
    open (newVisibility) {
      this.toggle(newVisibility);
    }
  },
  methods: {
    toggle (setVisible) {
      this.$props.open = setVisible;
    }
  }
};
</script>

<style scoped lang="scss">
@import 'stylesheets/new-dashboard/variables';

.navbar-dropdown {
  position: absolute;
  right: 0;
  width: 360px;
  margin-top: 18px;
  border-radius: 4px;
  box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.16);

  &::before {
    content: "";
    position: absolute;
    right: 0;
    width: 20px;
    height: 20px;
    transform: rotate(45deg) translateX(-50%);
    transform-origin: center center;
    border-radius: 4px;
    background-color: $white;
    box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.16);
  }
}

.navbar-dropdown-profile {
  display: flex;
  margin-bottom: 36px;

  .avatar-container {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    margin-right: 12px;
    overflow: hidden;
    border-radius: 50%;

    img {
      width: 100%;
      object-fit: cover;
    }
  }
}

.navbar-dropdown-container {
  position: relative;
  padding: 28px 24px 36px;
  border-radius: 4px 4px 0 0;
  background-color: $white;
}

.navbar-dropdown-iconLink {
  display: flex;
  margin-bottom: 20px;

  .icon-container {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    margin-right: 8px;
  }

  &:last-of-type {
    margin-bottom: 0;
  }
}

.navbar-dropdown-bottom {
  padding: 24px 30px;
  border-radius: 0 0 4px 4px;
  background-color: $softblue;
}

.notification-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  margin-left: 24px;
  border-radius: 50%;
  background-color: $notification;
}
</style>
