<h3 class="CDB-Text CDB-Size-large u-mainTextColor u-secondaryTextColor u-bSpace--m">
  <% if (state === 'selected') { %>
    <%- _t('components.modals.add-layer.imports.header-import.type-selected', { brand: 'SalesForce'}) %>
  <% } else { %>
    <%- _t('components.modals.add-layer.imports.header-import.type-import', { brand: 'SalesForce'}) %>
  <% } %>
</h3>
<p class="CDB-Text CDB-Size-medium u-altTextColor">
  <% if (state !== "selected") { %>
    <%- _t('components.modals.add-layer.imports.header-import.import-url', { brand: 'SalesForce'}) %>
  <% } else { %>
    <% if (acceptSync) { %>
      <%- _t('components.modals.add-layer.imports.header-import.sync-enabled', { brand: 'SalesForce'}) %>
    <% } else { %>
      <%- _t('components.modals.add-layer.imports.header-import.sync-disabled', { brand: 'SalesForce'}) %>
    <% } %>
  <% } %>
</p>
<% if (state === "selected") { %>
  <button class="NavButton NavButton--back ImportPanel-headerButton js-back">
    <i class="CDB-IconFont CDB-IconFont-arrowPrev"></i>
  </button>
<% } %>
