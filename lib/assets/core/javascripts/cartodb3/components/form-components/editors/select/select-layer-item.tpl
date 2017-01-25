<button type="button" class="CDB-ListDecoration-itemLink
  <% if (isSelected) { %> is-selected <% } %> <% if (isDestructive) { %>  u-alertTextColor <% } else { %> u-actionTextColor <% } %>"
  title="<%- nodeTitle %> - <%- layerName %>">
  <div class="u-flex">
    <span class="SelectorLayer-letter CDB-Text CDB-Size-small u-whiteTextColor u-rSpace u-upperCase" style="background-color: <%- color %>;"><%- layer_id %></span>
    <p class="CDB-Text CDB-Size-medium u-ellipsis u-flex">
      <%- nodeTitle %> <span class="u-altTextColor u-lSpace u-ellipsis"><%- layerName %></span>
    </p>
  </div>
</button>
