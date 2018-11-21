<template>
  <div class="navbar-dropdown" :class="{ 'is-open': open }">
    <ul class="navbar-dropdown-container">
      <li class="navbar-dropdown-profile">
        <div class="avatar-container">
          <img :src="userModel.avatar_url">
        </div>
        <div class="navbar-dropdown-userInfo">
          <p class="text is-semibold is-caption">{{userModel.username}}</p>
          <p class="text is-small">{{userModel.email}}</p>
        </div>
      </li>
      <li class="navbar-dropdown-iconLink">
        <div class="icon-container">
          <img svg-inline src="../../assets/icons/navbar/dropdown/settings.svg"/>
        </div>
        <a :href="`${ baseUrl }/profile`" class="text is-semibold is-caption is-txtGrey">{{ $t('UserDropdown.settings') }}</a>
      </li>
      <li class="navbar-dropdown-iconLink">
        <div class="icon-container">
          <img svg-inline src="../../assets/icons/navbar/dropdown/organization.svg"/>
        </div>
        <a :href="`${ baseUrl }/organization`" class="text is-semibold is-caption is-txtGrey">{{ $t('UserDropdown.organizationSettings') }}</a>
      </li>
      <li class="navbar-dropdown-iconLink">
        <div class="icon-container">
          <img svg-inline src="../../assets/icons/navbar/dropdown/api-keys.svg"/>
        </div>
        <a :href="`${ baseUrl }/your_apps`" class="text is-semibold is-caption is-txtGrey">{{ $t('UserDropdown.apiKeys') }}</a>
      </li>
      <li class="navbar-dropdown-iconLink">
        <div class="icon-container">
          <img svg-inline src="../../assets/icons/navbar/dropdown/profile.svg"/>
        </div>
        <a :href="`${ baseUrl }/me`" class="text is-semibold is-caption is-txtGrey" target="_blank">{{ $t('UserDropdown.publicProfile') }}</a>
      </li>
      <li class="navbar-dropdown-iconLink">
        <div class="icon-container">
          <img svg-inline src="../../assets/icons/navbar/dropdown/notifications.svg"/>
        </div>
        <a :href="`${ baseUrl }#`" class="text is-semibold is-caption is-txtGrey">{{ $t('UserDropdown.notifications') }}</a>
        <span v-if="notificationsCount > 0" class="notification-number text is-semibold is-small is-txtGrey">{{notificationsCount}}</span>
      </li>
    </ul>
    <a :href="`${ baseUrl }/logout`" class="navbar-dropdown-bottom">
      <div class="arrow"><img svg-inline src="../../assets/icons/navbar/dropdown/arrow-right.svg" /></div>
      <div class="title is-small is-txtAlert">{{ $t('UserDropdown.logout') }}</div>
    </a>
  </div>
</template>

<script>
export default {
  name: 'UserDropdown',
  props: {
    baseUrl: { type: String, default: '' },
    open: { type: Boolean, default: false },
    userModel: Object,
    notificationsCount: Number
  }
};
</script>
<style scoped lang="scss">
@import 'stylesheets/new-dashboard/variables';

.navbar-dropdown {
  visibility: hidden;
  position: absolute;
  right: 0;
  width: 360px;
  margin-top: 18px;
  transition: all 0.25s linear;
  border-radius: 4px;
  opacity: 0;
  box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.16);
  pointer-events: none;

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

  &.is-open {
    visibility: visible;
    opacity: 1;
    pointer-events: initial;
  }
}

.navbar-dropdown-profile {
  display: flex;
  align-items: center;
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
  display: flex;
  align-items: baseline;
  padding: 24px 30px;
  border-radius: 0 0 4px 4px;
  background-color: $softblue;

  &:hover {
    text-decoration: none;
  }

  & .arrow {
    margin-right: 8px;

    svg {
      vertical-align: middle;
    }
  }

  .title {
    letter-spacing: 1px;
  }
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
