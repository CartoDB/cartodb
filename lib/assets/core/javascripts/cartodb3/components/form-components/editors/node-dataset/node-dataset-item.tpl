<button type="button" class="CDB-ListDecoration-itemLink u-ellipsis u-actionTextColor" title="<%- val %>">
  <% if (typeof type != 'undefined' && type === 'node') { %>
    <div class="u-flex">
      <div class="CDB-Text CDB-Size-medium is-semibold u-rSpace u-upperCase" style="color: <%- color %>;"><%- val %></div>

      <p class="CDB-Text CDB-Size-medium u-ellipsis u-flex">
        <%- nodeTitle %><span class="u-altTextColor u-lSpace u-ellipsis"><%- layerName %></span>
      </p>
    </div>
  <% } else { %>
    <%- val %>
  <% } %>
</button>
