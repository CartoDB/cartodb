<h2 class="CDB-Text CDB-Size-medium is-semibold u-bSpace--xl u-flex u-alignCenter">
  <% if (isLayerVisible) { %> 
    <div class="u-iBlock u-rSpace--m">
      <input class="CDB-Checkbox js-toggle-layer" type="checkbox" checked>
      <span class="u-iBlock CDB-Checkbox-face"></span>
    </div>
  <% } else { %>
    <div class="u-iBlock u-rSpace--m">
      <input class="CDB-Checkbox js-toggle-layer" type="checkbox">
      <span class="u-iBlock CDB-Checkbox-face"></span>
    </div>
  <% } %>
  <span>
    <%= layerName %>
  </span>
</h2>
