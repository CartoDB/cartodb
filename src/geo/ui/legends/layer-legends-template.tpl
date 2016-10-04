<h2 class="CDB-Text CDB-Size-medium is-semibold u-bSpace--xl u-flex u-alignCenter LayerSelector js-layer-selector
          <% if (!showLayerSelector) { %>is-hidden<% } %>">
  <span class="u-iBlock u-rSpace--m">
    <% if (isLayerVisible) { %>
      <input class="CDB-Checkbox js-toggle-layer" type="checkbox" checked>
    <% } else { %>
      <input class="CDB-Checkbox js-toggle-layer" type="checkbox">
    <% } %>
    <span class="u-iBlock CDB-Checkbox-face"></span>
  </span>
  <span class="u-ellipsis"><%- layerName %></span>
</h2>

<div class="Legends js-legends <% if (!showLegends) { %>is-hidden<% } %>"></div>