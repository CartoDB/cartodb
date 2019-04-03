<% if (seats > users) { %>
  <% if ((seats - users) < 5) { %>
    <p class="CDB-Text Form-footerText">
      <i class="CDB-IconFont CDB-IconFont-info Form-footerIcon"></i>
      <%= _t('dashboard.views.organization.org_users.near_limit', {upgradeUrl: upgradeUrl}) %>
    </p>
  <% } else { %>
    <em></em>
  <% } %>
<% } else if (!customHosted) { %>
  <p class="CDB-Text Form-footerText">
    <i class="CDB-IconFont CDB-IconFont-info Form-footerIcon"></i>
    <%= _t('dashboard.views.organization.org_users.contact') %>
  </p>
  <a href="<%- upgradeUrl %>" class="CDB-Text Button Button--positive"><span><%= _t('dashboard.views.organization.org_users.upgrade') %></span></a>
<% } %>
