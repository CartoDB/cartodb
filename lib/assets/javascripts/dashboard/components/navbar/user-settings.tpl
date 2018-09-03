<li class="Header-settingsItem u-hideOnTablet">
  <a href="<%- mapsUrl %>" class="Header-settingsLink Header-settingsLink--public"><%= _t('dashboard.components.navbar.user_settings.maps') %></a>
</li>

<li class="Header-settingsItem u-hideOnTablet">
  <a href="<%- datasetsUrl %>" class="Header-settingsLink Header-settingsLink--public"><%= _t('dashboard.components.navbar.user_settings.datasets') %></a>
</li>

<li class="Header-settingsItem Header-settingsItem--avatar">
  <button class="UserAvatar js-dropdown-target">
    <img src="<%- avatarUrl %>" class="UserAvatar-img UserAvatar-img--medium js-user-avatar-img" />
  </button>
</li>
