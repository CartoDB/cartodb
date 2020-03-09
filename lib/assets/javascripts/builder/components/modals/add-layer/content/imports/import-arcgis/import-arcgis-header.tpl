<h3 class="CDB-Text CDB-Size-large u-mainTextColor u-secondaryTextColor u-bSpace--m">
  <% if (state === 'selected') { %>
    <%= _t('components.modals.add-layer.imports.header-import.type-selected', { brand: 'ArcGIS<sup>&trade;</sup>' }) %>
  <% } else { %>
    <%= _t('components.modals.add-layer.imports.header-import.type-import', { brand: 'ArcGIS<sup>&trade;</sup>' }) %>
  <% } %>
</h3>
<p class="CDB-Text CDB-Size-medium u-altTextColor">
  <% if (state !== "selected") { %>
    <%= _t('components.modals.add-layer.imports.header-import.import-data', { brand: 'ArcGIS<sup>&trade;</sup>' }) %>
  <% } else { %>
    <%- _t('components.modals.add-layer.imports.header-import.sync-options') %>
  <% } %>
</p>
<% if (state === "selected") { %>
  <button class="ImportPanel-headerButton CDB-Text is-semibold u-upperCase CDB-Size-medium u-actionTextColor js-back">
    <i class="CDB-IconFont is-semibold CDB-IconFont-arrowPrev u-mr--4"></i>
    <span><%= _t('components.modals.add-layer.imports.header-import.go-back') %></span>
  </button>
<% } %>
