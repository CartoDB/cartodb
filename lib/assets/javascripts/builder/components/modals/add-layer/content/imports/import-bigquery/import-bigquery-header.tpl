<p class="CDB-Text CDB-Size-medium u-secondaryTextColor">
 <% state %>
  <% if (state === "error") { %>
    <%- _t('components.modals.add-layer.imports.service-import.state-error', { title: 'BigQuery' }) %>
  <% } else if (state === "selected") { %>
    <%- _t('components.modals.add-layer.imports.header-import.sync-options') %>
  <% } else { %>
    <%= _t('components.modals.add-layer.imports.header-import.import-data', { brand: 'BigQuery' }) %>
  <% } %>
</p>
<% if (state === "selected") { %>
  <button class="ImportPanel-headerButton CDB-Text is-semibold u-upperCase CDB-Size-medium u-actionTextColor js-back">
    <i class="CDB-IconFont is-semibold CDB-IconFont-arrowPrev u-mr--4"></i>
    <span><%= _t('components.modals.add-layer.imports.header-import.go-back') %></span>
  </button>
<% } %>
