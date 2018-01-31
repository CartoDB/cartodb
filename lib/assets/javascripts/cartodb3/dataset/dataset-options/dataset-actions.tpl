<% if (hasGeometry) { %>
  <button class="u-rSpace--xl Dataset-tablePreview js-previewMap">
    <span class="u-upperCase CDB-Button-Text CDB-Text CDB-Size-small"><%- _t('dataset.preview-map.preview') %></span>
  </button>
<% } %>
<% if (canCreateMap) { %>
  <button class="CDB-Button CDB-Button--primary u-upperCase js-createMap">
    <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small"><%- _t('dataset.create-map.title') %></span>
  </button>
<% } %>
