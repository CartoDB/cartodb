<% if (hasFailed) { %>
  <div class="ImportItem-text is-failed" title="<%- tableName %>">
    <%- _t('components.background-geocoding-item.errors.geocoding-layer', { tableName: tableName }) %>
  </div>
  <button class="Button Button-importShowDetails u-upperCase js-info"><%- _t('components.background-geocoding-item.show') %></button>
  <button class="ImportItem-closeButton js-close">
    <i class="CDB-IconFont CDB-IconFont-close ImportItem-closeButtonIcon"></i>
  </button>
<% } else if (hasCompleted) { %>
  <% if (isLatLngType) { %>
    <div class="ImportItem-text is-completed">
    <%- _t('components.background-geocoding-item.geocoded-by-lat-lng') %>
    </div>
  <% } else { %>
    <div class="ImportItem-text <%- realRows > 0 ? 'is-completed' : 'is-alerted' %>" title="<%- tableName %>">
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
    </div>
    <button type="button" class="Button Button-importShowDetails u-upperCase js-info"><%- _t('components.background-geocoding-item.show') %></button>
  <% } %>
  <button class="ImportItem-closeButton js-close">
    <i class="CDB-IconFont CDB-IconFont-close ImportItem-closeButtonIcon"></i>
  </button>
<% } else { %>
  <div class="ImportItem-text" title="<%- tableName %>">
    <% if (realRows > 0) { %>
    <%- _t('components.background-geocoding-item.geocoded', { realRowsFormatted: realRowsFormatted, processableRowsFormatted: processableRowsFormatted, smart_count: processableRows }) %>
    <% } else { %>
    <%- _t('components.background-geocoding-item.geocoding', { tableName: tableName }) %>
    <% } %>
  </div>
  <div class="ImportItem-progress">
    <div class="progress-bar">
      <span class="bar-2" style="width:<%- width %>%"></span>
    </div>
  </div>
  <% if (canCancel) { %>
    <button class="ImportItem-closeButton js-abort">
      <i class="CDB-IconFont CDB-IconFont-close ImportItem-closeButtonIcon"></i>
    </button>
  <% } %>
<% } %>
