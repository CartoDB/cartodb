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
  <button class="NavButton NavButton--back ImportPanel-headerButton js-back">
    <i class="CDB-IconFont CDB-IconFont-arrowPrev"></i>
  </button>
<% } %>
