<ul class="SettingsDropdown">
  <li>
    <div class="SettingsDropdown-sameline">
      <p class="CDB-Text CDB-Size-medium"><%- name %></p>
    </div>
    <p class="CDB-Text CDB-Size-medium u-altTextColor u-tSpace u-ellipsis">
      <%- email %>
    </p>
  </li>
</ul>

<div class="BreadcrumbsDropdown-listItem is-dark CDB-Text CDB-Size-medium">
  <ul>
    <li class="u-bSpace--m"><a href="<%- dashboardUrl %>"><%= _t('dashboard.components.navbar.user_settings.your_dashboard') %></a></li>
    <li class="u-bSpace--m"><a href="<%- publicProfileUrl %>"><%= _t('dashboard.components.navbar.user_settings.your_profile') %></a></li>
    <li class="u-bSpace--m"><a href="<%- accountProfileUrl %>"><%= _t('dashboard.components.navbar.user_settings.account') %></a></li>
    <li><a href="<%- logoutUrl %>"><%= _t('dashboard.components.navbar.user_settings.close') %></a></li>
  </li>
  </ul>
</div>
