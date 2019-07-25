<template>
    <ul class="settingssidebar">
      <li class="settingssidebar-item">
        <a :href="`${ baseUrl }/profile`" class="text is-txtPrimary settingssidebar-link">Profile</a>
      </li>
      <li class="settingssidebar-item">
        <a :href="`${ baseUrl }/account`" class="text is-txtPrimary settingssidebar-link">Account</a>
      </li>
      <li class="settingssidebar-item">
        <router-link :to="{ name: 'connected_apps' }" class="text is-txtPrimary settingssidebar-link" :staticRoute="'/dashboard/connected_apps'">
          Connected Apps
        </router-link>
      </li>
      <li class="settingssidebar-item">
        <a :href="`https://carto-staging.com/account/${ userModel.name }/plan`" class="text is-txtPrimary settingssidebar-link">Billing</a>
      </li>
      <span class="settingssidebar-separator"></span>
      <li class="settingssidebar-item">
        <a :href="`${ baseUrl }/billing`" class="text is-txtPrimary settingssidebar-link">Developer Settings</a>
      </li>
   </ul>
</template>

<script>
export default {
  name: 'SettingsSidebar',
  props: {
    baseUrl: { type: String, default: '' },
    userModel: Object
  },
};
</script>

<style lang="scss" scoped>
@import 'new-dashboard/styles/variables';

.settingssidebar-item {
  line-height: 35px;
}

.settingssidebar-link {
  font-size: 14px;

  &:hover {
    text-decoration: underline;
  }
}

.settingssidebar-separator {
  display: flex;
  width: 240px;
  height: 1px;
  margin: 14px 0;
  background-color: rgba(0, 0, 0, 0.1);
}

</style>