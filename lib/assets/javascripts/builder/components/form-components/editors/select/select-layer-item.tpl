<button type="button" class="CDB-ListDecoration-itemLink
  <% if (isSelected) { %> is-selected <% } %> <% if (isDestructive) { %>  u-alertTextColor <% } else { %> u-actionTextColor <% } %>"
  title="<%- nodeTitle %> - <%- layerName %>">
  <div class="u-flex u-alignCenter">
    <span class="CDB-Text CDB-Size-small is-semibold u-bSpace--s u-upperCase" style="color: <%- color %>;">
      <%- layer_id %>
    </span>

    <% if (!isSourceType) { %>
      <span class="CDB-Text CDB-Size-small u-lSpace--s u-flex" style="color: <%- color %>;">
        <i class="CDB-IconFont CDB-Size-small CDB-IconFont-ray"></i>
      </span>
    <% } %>

    <span class="CDB-Text CDB-Size-medium u-lSpace u-ellipsLongText">
      <%= nodeTitle %>
    </span>

    <span class="CDB-Text CDB-Size-medium u-altTextColor u-ellipsis u-lSpace" title="<%= layerName %>">
      <%= layerName %>
    </span>
  </div>
</button>
