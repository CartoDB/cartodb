<ul class="BreadcrumbsDropdown-list CDB-Text CDB-Size-medium">
  <li class="BreadcrumbsDropdown-listItem">
    <span class="BreadcrumbsDropdown-icon u-rSpace--xl">
      <img class="UserAvatar-img UserAvatar-img--small" src="<%- avatarUrl %>" title="<%- userName %>" alt="<%- userName %>" />
    </span>
    <nav class="BreadcrumbsDropdown-options">
      <a href="<%- mapsUrl %>" class="BreadcrumbsDropdown-optionsItem <%- isMaps && !isDeepInsights && !isLocked ? 'is-selected' : '' %>"><%= _t('dashboard.components.dashboard-header.breadcrumbs.dropdown.maps') %></a>
      <a href="<%- datasetsUrl %>" class="BreadcrumbsDropdown-optionsItem has-margin <%- isDatasets && !isLocked ? 'is-selected' : '' %>"><%= _t('dashboard.components.dashboard-header.breadcrumbs.dropdown.datasets') %></a>
    </nav>
  </li>
  <li class="BreadcrumbsDropdown-listItem is-dark u-flex">
    <span class="BreadcrumbsDropdown-lockIcon BreadcrumbsDropdown-icon u-flex u-alignCenter u-justifyCenter u-rSpace--xl">
      <i class="CDB-IconFont CDB-IconFont-lock"></i>
    </span>
    <nav class="BreadcrumbsDropdown-options">
      <a href="<%- lockedMapsUrl %>" class="BreadcrumbsDropdown-optionsItem <%- isMaps && isLocked ? 'is-selected' : '' %>"><%= _t('dashboard.components.dashboard-header.breadcrumbs.dropdown.lck_maps') %></a>
      <a href="<%- lockedDatasetsUrl %>" class="BreadcrumbsDropdown-optionsItem has-margin <%- isDatasets && isLocked ? 'is-selected' : '' %>"><%= _t('dashboard.components.dashboard-header.breadcrumbs.dropdown.lck_datasets') %></a>
    </nav>
  </li>
</ul>
