<% if (hasFailed) { %>
    <%- _t('components.background-geocoding-item.errors.geocoding-layer', { tableName: tableName }) %>
<% } else if (hasCompleted) { %>
  <% if (isLatLngType) { %>
    <%- _t('components.background-geocoding-item.geocoded-by-lat-lng') %>
  <% } else { %>
      <% if (realRows === 0) { %>
        <% if (tableName) { %>
          <%- _t('components.background-geocoding-item.errors.no-rows-geocoded.in-dataset', { tableName: tableName }) %>
        <% } else { %>
          <%- _t('components.background-geocoding-item.errors.no-rows-geocoded.without-dataset') %>
        <% } %>
      <% } else { %>

        <% if (tableName) { %>
          <%- _t('components.background-geocoding-item.rows-geocoded.in-dataset', { tableName: tableName, realRowsFormatted: realRowsFormatted, smart_count: realRows}) %>
        <% } else { %>
          <%- _t('components.background-geocoding-item.rows-geocoded.without-dataset', { realRowsFormatted: realRowsFormatted, smart_count: realRows }) %>
        <% } %>
      <% } %>
  <% } %>
<% } else { %>
    <%- width %>%
    <% if (realRows > 0) { %>
    <%- _t('components.background-geocoding-item.geocoded', { realRowsFormatted: realRowsFormatted, processableRowsFormatted: processableRowsFormatted, smart_count: processableRows }) %>
    <% } else { %>
    <%- _t('components.background-geocoding-item.geocoding', { tableName: tableName }) %>
    <% } %>
<% } %>
