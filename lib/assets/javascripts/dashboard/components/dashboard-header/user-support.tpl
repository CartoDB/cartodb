<% if (userType === 'org') { %>
  <a href="mailto:enterprise-support@carto.com" class="Header-navigationLink u-hideOnMobile"><%= _t('dashboard.components.dashboard-header.user-support.support') %></a>
<% } else if (userType === 'client' || userType === 'internal') { %>
  <a href="mailto:<%= _t('email_support') %>" class="Header-navigationLink u-hideOnMobile"><%= _t('dashboard.components.dashboard-header.user-support.support') %></a>
<% } else { %>
  <a href="<%= _t('community_link') %>" class="Header-navigationLink u-hideOnMobile"><%= _t('dashboard.components.dashboard-header.user-support.support') %></a>
<% } %>
