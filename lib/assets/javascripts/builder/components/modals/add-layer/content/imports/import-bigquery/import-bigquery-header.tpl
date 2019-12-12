<p class="CDB-Text CDB-Size-medium u-secondaryTextColor">
  <% if (state !== "selected") { %>
    <%= _t('components.modals.add-layer.imports.arcgis.import-data', { brand: 'BigQuery' }) %>
  <% } else { %>
    <%- _t('components.modals.add-layer.imports.arcgis.sync-options') %>
  <% } %>
</p>
<% if (state === "selected") { %>
  <button class="NavButton NavButton--back ImportPanel-headerButton js-back">
    <i class="CDB-IconFont CDB-IconFont-arrowPrev"></i>
  </button>
<% } %>
