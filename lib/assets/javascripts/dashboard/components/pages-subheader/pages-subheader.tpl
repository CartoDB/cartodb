<% if (!isCartoDBHosted) { %>
  <a class="Filters-link" href="<%= planUrl %>">
<% } %>

<div class="SideMenu-progress">
  <div class="SideMenu-progressBar">
    <div class="progress-bar">
      <span class="bar-2 <%= progressBarClass %>" style="width: <%- usedDataPct %>%"></span>
    </div>
  </div>

  <span class="CDB-Text CDB-Size-medium u-altTextColor"><%= _t('dashboard.components.pages_subheader.pages_subheader.used_of_avail', {usedDataStr: usedDataStr, availableDataStr: availableDataStr}) %></span>
</div>

<span class="SideMenu-separator"></span>

<% if (!isCartoDBHosted) { %>
  </a>
<% } %>

<div class="SideMenu-type">
  <ul class="SideMenu-list">
    <li class="SideMenu-typeItem"><a href="<%= profileUrl %>" class="SideMenu-typeLink <% if (path === profileUrl) { %>is-selected<% } %>"><%= _t('dashboard.components.pages_subheader.pages_subheader.profile') %></a></li>
    <li class="SideMenu-typeItem"><a href="<%= accountUrl %>" class="SideMenu-typeLink <% if (path === accountUrl) { %>is-selected<% } %>"><%= _t('dashboard.components.pages_subheader.pages_subheader.account') %></a></li>
    <li class="SideMenu-typeItem"><a href="<%= apiKeysUrl %>" class="SideMenu-typeLink <% if (path === apiKeysUrl) { %>is-selected<% } %>"><%= _t('dashboard.components.pages_subheader.pages_subheader.api_keys') %></a></li>
    <% if (!isCartoDBHosted && !isInsideOrg) { %>
      <li class="SideMenu-typeItem"><a href="<%= planUrl %>" class="SideMenu-typeLink"><%= _t('dashboard.components.pages_subheader.pages_subheader.billing') %></a></li>
    <% } %>
    <% if (isOrgAdmin) { %>
      <li class="SideMenu-typeItem"><a href="<%= organizationUrl %>" class="SideMenu-typeLink <% if (path === organizationUrl) { %>is-selected<% } %>"><%= _t('dashboard.components.pages_subheader.pages_subheader.org_settings') %></a></li>
    <% } %>
  </ul>
</div>

<div class="SideMenu-helpSegment CDB-Text CDB-Size-medium u-flex u-alignCenter">
  <div class="LayoutIcon LayoutIcon--darkGrey">
    <i class="CDB-IconFont CDB-IconFont-boss"></i>
  </div>
  <div class="SideMenu-helpSegment--paragraph">
    <p><%= _t('dashboard.components.pages_subheader.pages_subheader.issues') %></p>
    <p>
      <a href="mailto:<%= upgradeContactEmail %>"><% if (!isInsideOrg) { %><%= _t('dashboard.components.pages_subheader.pages_subheader.cont_support') %><% }
        else if (!isOrgOwner) { %><%= _t('dashboard.components.pages_subheader.pages_subheader.cont_admin') %><% }
        else { %><%= _t('dashboard.components.pages_subheader.pages_subheader.cont_vip') %><% } %></a>
    </p>
  </div>
</div>
