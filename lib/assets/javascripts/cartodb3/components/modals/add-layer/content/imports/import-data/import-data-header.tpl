<h3 class="CDB-Text CDB-Size-large u-mainTextColor u-secondaryTextColor u-bSpace--m">
  <% if (state === 'selected') { %>
    <%- _t('components.modals.add-layer.imports.header-import.file-selected') %>
  <% } else { %>
    <%- _t('components.modals.add-layer.imports.header-import.upload-file-url', { smart_count: fileEnabled ? 1 : 0 }) %>
  <% } %>
</h3>
<p class="CDB-Text CDB-Size-medium u-altTextColor">
  <% if (state !== "selected") { %>
    <% fileEnabledText = _t('components.modals.add-layer.imports.header-import.select-a-file') +
      ' <a href="http://docs.cartodb.com/cartodb-editor/datasets/#supported-file-formats">' +
      _t('components.modals.add-layer.imports.header-import.see-all-formats') +
      '</a>'
    %>
    <%= _t('components.modals.add-layer.imports.header-import.paste-url', {
      fileEnabled: fileEnabled ? fileEnabledText : ''
    }) %>
  <% } %>
  <% if (state === "selected") { %>
    <% if (acceptSync) { %>
      <%- _t('components.modals.add-layer.imports.header-import.sync-enabled') %>
    <% } else { %>
      <%- _t('components.modals.add-layer.imports.header-import.sync-disabled') %>
    <% } %>
  <% } %>
</p>
<% if (state === "selected") { %>
  <button class="NavButton NavButton--back ImportPanel-headerButton js-back">
    <i class="CDB-IconFont CDB-IconFont-arrowPrev"></i>
  </button>
<% } %>
