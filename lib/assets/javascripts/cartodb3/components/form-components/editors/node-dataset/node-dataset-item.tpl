<button type="button" class="CDB-ListDecoration-itemLink u-ellipsis u-actionTextColor" title="<%- val %>">
  <% if (typeof type != 'undefined' && type === 'node') { %>
    <div class="u-flex">
      <span
        class="SelectorLayer-letter CDB-Text CDB-Size-small u-whiteTextColor u-rSpace u-upperCase"
        style="background-color: <%- color %>;"><%- val %></span>
      <p class="CDB-Text CDB-Size-medium u-ellipsis u-flex">
        <%- nodeTitle %><span class="u-altTextColor u-lSpace u-ellipsis"><%- layerName %></span>
      </p>
    </div>
  <% } else { %>
    <%- val %>
  <% } %>
</button>
