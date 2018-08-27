<ul class="SettingsDropdown">
  <li>
    <div class="SettingsDropdown-sameline">
      <p class="CDB-Text CDB-Size-medium"><%- name %></p>
      <p class="SettingsDropdown-accountType CDB-Text CDB-Size-small u-altTextColor u-upperCase"><%- accountType %></p>
    </div>
    <p class="CDB-Text CDB-Size-medium u-altTextColor u-tSpace u-ellipsis">
      <%- email %>
    </p>
  </li>
  <li class="u-tSpace-xl">
    <p class="SettingsDropdown-userRole">
      <% if (isViewer) { %>
        <span class="UserRoleIndicator Viewer CDB-Text CDB-Size-small is-semibold u-altTextColor"><%= _t('dashboard.components.dashboard-header.settings-dropdown.viewer') %></span>
        <% if (orgDisplayEmail) { %>
          <a href="mailto:<%- orgDisplayEmail %>" class="CDB-Text CDB-Size-small"><%= _t('dashboard.components.dashboard-header.settings-dropdown.become') %></a>
        <% } %>
      <% } %>
      <% if (isBuilder) { %>
        <span class="UserRoleIndicator Builder CDB-Text CDB-Size-small is-semibold u-altTextColor"><%= _t('dashboard.components.dashboard-header.settings-dropdown.builder') %></span>
      <% } %>
    </p>
  </li>
  <li class="u-tSpace-xl">
    <% if (showUpgradeLink) { %>
      <a href="<%- upgradeUrl %>" class="SettingsDropdown-itemLink">
    <% } %>

    <div class="SettingsDropdown-sameline u-bSpace CDB-Text CDB-Size-medium u-altTextColor">
      <p class="DefaultDescription"><%- usedDataStr %><%= _t('dashboard.components.dashboard-header.settings-dropdown.of') %><%- availableDataStr %><%= _t('dashboard.components.dashboard-header.settings-dropdown.used') %></p>
      <% if (showUpgradeLink) { %>
        <p class="SettingsDropdown-itemLinkText u-actionTextColor"><%= _t('dashboard.components.dashboard-header.settings-dropdown.upgrade') %></p>
      <% } %>
    </div>
    <div class="SettingsDropdown-progressBar <%- progressBarClass %>">
      <div class="progress-bar">
        <span class="bar-2" style="width: <%- usedDataPct %>%"></span>
      </div>
    </div>

    <% if (showUpgradeLink) { %>
      </a>
    <% } %>
  </li>
</ul>
<div class="BreadcrumbsDropdown-listItem is-dark CDB-Text CDB-Size-medium">
  <ul>
    <li class="u-bSpace--m"><a href="<%- publicProfileUrl %>"><%= _t('dashboard.components.dashboard-header.settings-dropdown.pub_profile') %></a></li>
    <li class="u-bSpace--m"><a href="<%- accountProfileUrl %>"><%= _t('dashboard.components.dashboard-header.settings-dropdown.account') %></a></li>
    <% if (isOrgAdmin) { %>
      <li class="u-bSpace--m"><a href="<%- organizationUrl %>"><%= _t('dashboard.components.dashboard-header.settings-dropdown.org') %></a></li>
    <% } %>
    <% if (engineEnabled || mobileAppsEnabled) { %>
      <li class="u-bSpace--m"><a href="<%- apiKeysUrl %>"><%= _t('dashboard.components.dashboard-header.settings-dropdown.api_keys') %></a></li>
    <% } %>
    <li><a href="<%- logoutUrl %>"><%= _t('dashboard.components.dashboard-header.settings-dropdown.close') %></a></li>
  </ul>
</div>
