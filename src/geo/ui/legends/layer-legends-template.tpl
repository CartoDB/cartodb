<h2 class="CDB-Text CDB-Size-medium is-semibold u-bSpace--xl u-flex u-alignCenter">
  <% if (isLayerVisible) { %> 
    <span class="u-iBlock u-rSpace--m">
      <input class="CDB-Checkbox js-toggle-layer" type="checkbox" checked>
      <span class="u-iBlock CDB-Checkbox-face"></span>
    </span>
  <% } else { %>
    <span class="u-iBlock u-rSpace--m">
      <input class="CDB-Checkbox js-toggle-layer" type="checkbox">
      <span class="u-iBlock CDB-Checkbox-face"></span>
    </span>
  <% } %>
  <span class="u-ellipsis">
    <%= layerName %>
  </span>
</h2>
