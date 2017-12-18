<button type="button" class="CDB-ListDecoration-itemLink
  <% if (isSelected) { %> is-selected <% } %> <% if (isDestructive) { %>  u-alertTextColor <% } else { %> u-actionTextColor <% } %>"
  title="<%- nodeTitle %> - <%- layerName %>">
  <div class="u-flex">
    <div class="CDB-Text CDB-Size-medium is-semibold u-rSpace u-upperCase" style="color: <%- color %>;"><%- layer_id %></div>

    <p class="CDB-Text CDB-Size-medium u-ellipsis u-flex">
      <%- nodeTitle %> <span class="u-altTextColor u-lSpace u-ellipsis"><%- layerName %></span>
    </p>
  </div>
</button>
