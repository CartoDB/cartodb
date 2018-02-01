Hey <strong><%- userName %></strong>, you're over your disk limits.
<% if (userType === "admin") { %>
  <a href="mailto:<%- upgradeContactEmail %>">Contact us</a> for upgrading your account.
<% } %>
<% if (userType === "org") { %>
  Start thinking about <a href="mailto:<%- upgradeContactEmail %>">contacting your admin</a>.
<% } %>
<% if (userType === "regular") { %>
  Start thinking about <a href="<%- upgradeUrl %>?utm_source=Dashboard_Limits_Nearing&utm_medium=referral&utm_campaign=Upgrade_from_Dashboard&utm_content=upgrading%20your%20plan" class ="underline">upgrading your plan</a>.
<% } %>
<% if (userType === "internal") { %>
  Feel free to <a href="mailto:<%- upgradeContactEmail %>">contact us</a> for more resources.
<% } %>
