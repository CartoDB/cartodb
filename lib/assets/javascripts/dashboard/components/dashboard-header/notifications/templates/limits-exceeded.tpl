  <%= _t('dashboard.components.dashboard-header.notifications.templates.limits_exceeded.over_limits', {userName: userName}) %>
<% if (userType === "admin") { %>
  <%= _t('dashboard.components.dashboard-header.notifications.templates.limits_exceeded.contact_us', {upgradeContactEmail: upgradeContactEmail}) %>
<% } %>
<% if (userType === "org") { %>
  <%= _t('dashboard.components.dashboard-header.notifications.templates.limits_exceeded.contact_admin', {upgradeContactEmail: upgradeContactEmail}) %>
<% } %>
<% if (userType === "regular") { %>
  <%= _t('dashboard.components.dashboard-header.notifications.templates.limits_exceeded.start_thinking') %>
  <a href="<%- upgradeUrl %>?utm_source=Dashboard_Limits_Nearing&utm_medium=referral&utm_campaign=Upgrade_from_Dashboard&utm_content=upgrading%20your%20plan" class ="underline">
  <%= _t('dashboard.components.dashboard-header.notifications.templates.limits_exceeded.upgrade_plan') %></a>.
<% } %>
<% if (userType === "internal") { %>
  <%= _t('dashboard.components.dashboard-header.notifications.templates.limits_exceeded.feel_free', {upgradeContactEmail: upgradeContactEmail}) %>
<% } %>
