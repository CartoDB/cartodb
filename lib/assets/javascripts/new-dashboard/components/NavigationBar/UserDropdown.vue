<template>
  <div class="navbar-dropdown" :class="{ 'is-open': open }">
    <ul class="navbar-dropdown-container">
      <li class="navbar-dropdown-new-platform u-flex u-flex__align--center u-flex__justify--between u-mb--24">
        <div class="navbar-dropdown-userInfo">
          <p class="text is-semibold is-txtPrimary">{{$t('UserDropdown.carto3.title')}}</p>
          <p class="text is-small u-mt--4">{{$t('UserDropdown.carto3.message')}}</p>
        </div>
        <div class="">
          <a href="https://app.carto.com" target="_blank">
            <img src="../../assets/icons/common/open-in-new.svg" />
          </a>
        </div>
      </li>
      <li class="navbar-dropdown-profile">
        <div class="avatar-container">
          <img :src="userModel.avatar_url">
        </div>
        <div class="navbar-dropdown-userInfo">
          <p class="text is-semibold is-caption">{{(userModel.organization || {}).random_saml_username ? userModel.email : userModel.username}}</p>
          <p v-if="!(userModel.organization || {}).random_saml_username" class="text is-small">{{userModel.email}}</p>
        </div>
      </li>
      <li class="navbar-dropdown-iconLink">
        <div class="icon-container">
          <img svg-inline src="../../assets/icons/navbar/dropdown/settings.svg"/>
        </div>
        <a :href="`${ baseUrl }/profile`" class="text is-semibold is-caption is-txtGrey" @click="linkClicked">{{ $t('UserDropdown.settings') }}</a>
      </li>
      <li class="navbar-dropdown-iconLink" v-if="isOrganizationAdmin">
        <div class="icon-container">
          <img svg-inline src="../../assets/icons/navbar/dropdown/organization.svg"/>
        </div>
        <a :href="`${ baseUrl }/organization`" class="text is-semibold is-caption is-txtGrey" @click="linkClicked">{{ $t('UserDropdown.organizationSettings') }}</a>
      </li>
      <li @click="linkClicked" class="navbar-dropdown-iconLink">
        <div class="icon-container">
          <img svg-inline src="../../assets/icons/navbar/dropdown/api-keys.svg"/>
        </div>
        <a :href="`${ baseUrl }/your_apps`" class="text is-semibold is-caption is-txtGrey" @click="linkClicked">{{ $t('UserDropdown.apiKeys') }}</a>
      </li>
      <li class="navbar-dropdown-iconLink">
        <div class="icon-container">
          <img svg-inline src="../../assets/icons/navbar/dropdown/profile.svg"/>
        </div>
        <a :href="`${ baseUrl }/me`" class="text is-semibold is-caption is-txtGrey" target="_blank" @click="linkClicked">{{ $t('UserDropdown.publicProfile') }}</a>
      </li>
      <li class="navbar-dropdown-iconLink">
        <div class="icon-container">
          <img svg-inline src="../../assets/icons/navbar/dropdown/notifications.svg"/>
        </div>
        <router-link :to="{ name: 'notifications' }" class="text is-semibold is-caption is-txtGrey" @click.native="linkClicked" :staticRoute="'/dashboard/notifications'">
          {{ $t('UserDropdown.notifications') }}
        </router-link>
        <span v-if="notificationsCount > 0" class="notification-number text is-semibold is-small is-txtGrey">{{notificationsCount}}</span>
      </li>
      <li class="navbar-dropdown-iconLink">
        <div class="icon-container">
          <img svg-inline src="../../assets/icons/navbar/dropdown/feedback.svg"/>
        </div>
        <a href="https://docs.google.com/forms/d/e/1FAIpQLScBQUWd-TP3Qy514DOCNg-KoLrViHijUR5giLAMS-3jmDnrPg/viewform" class="text is-semibold is-caption is-txtGrey" target="_blank" rel="noopener noreferrer" @click="linkClicked">
          {{ $t('UserDropdown.feedback') }}
        </a>
      </li>
    </ul>
    <a :href="`${ baseUrl }/logout`" class="navbar-dropdown-bottom" @click="linkClicked">
      <div class="arrow"><img src="../../assets/icons/navbar/dropdown/arrow-right.svg" /></div>
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
  },
  computed: {
    isOrganizationAdmin () {
      return this.userModel.org_admin;
    }
  },
  methods: {
    linkClicked () {
      this.$emit('linkClick');
    }
  }
};
</script>
<style scoped lang="scss">
@import 'new-dashboard/styles/variables';

.navbar-dropdown {
  visibility: hidden;
  position: absolute;
  right: 0;
  width: 360px;
  margin-top: 18px;
  transition: all 0.25s linear;
  border-radius: 4px;
  opacity: 0;
  box-shadow: $dropdown__shadow;
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
    box-shadow: $dropdown__shadow;
  }

  &.is-open {
    visibility: visible;
    opacity: 1;
    pointer-events: initial;
  }
}

.navbar-dropdown-new-platform {
  background: rgba($blue--500, 0.08);
  border-radius: 4px;
  padding: 16px;

  & .is-txtPrimary {
    color: #024d9e
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

    img {
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
  margin-top: 2px;
  margin-left: 24px;
  border-radius: 50%;
  background-color: $notification__bg-color;
}
</style>
