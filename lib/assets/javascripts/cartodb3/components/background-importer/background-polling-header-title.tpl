<% if (totalPollings === 1) { %>
  <% if (imports > 0) { %>
  <%- _t('components.background-importer.connecting') %>
 <% } %>
  <% if (geocodings > 0) { %>
  <%- _t('components.background-importer.geocoding') %>
  <% } %>
<%- _t('components.background-importer.dataset') %>
<% } else { %>
<%- _t('components.background-importer.working') %>
<% } %>
