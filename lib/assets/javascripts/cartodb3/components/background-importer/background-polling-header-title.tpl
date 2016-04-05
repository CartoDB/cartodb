<% if (totalPollings === 1) { %>
  <% if (imports > 0) { %> Connecting <% } %>
  <% if (geocodings > 0) { %>
    Geocoding
  <% } %>
  dataset...
<% } else { %>
  Working...
<% } %>
