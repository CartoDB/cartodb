<% if (type === 'text') { %>
<%- label %><% if (selectedChild) { %> <span class="CDB-NavSubmenu-status js-NavSubmenu-status u-hintTextColor"><%- selectedChild %></span><% } %>
<% } else { %>
<img class="Tab-paneLabel-image js-label" src="<%- label %>" />
<% } %>
