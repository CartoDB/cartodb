<label class="CDB-LayerLegends-Title">
  <% if (isLayerVisible) { %> 
    <input type="checkbox" class="js-toggle-layer" checked>
  <% } else { %>
    <input type="checkbox" class="js-toggle-layer">
  <% } %>
  <%= layerName %>
</label>
