<p class="CDB-Text CDB-Size-medium u-secondaryTextColor">
  <% if (state !== "selected") { %>
    <%= _t('components.modals.add-layer.imports.header-import.import-data', { brand: title}) %>
  <% } else { %>
    <%- _t('components.modals.add-layer.imports.header-import.sync-options') %>
  <% } %>
</p>
