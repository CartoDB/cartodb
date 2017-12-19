<button type="button" class="CDB-ListDecoration-itemLink u-ellipsis u-actionTextColor" title="<%- val %>">
  <% if (typeof type != 'undefined' && type === 'node') { %>
    <div class="u-flex u-alignCenter">
      <span class="CDB-Text CDB-Size-small is-semibold u-bSpace--s u-upperCase" style="color: <%- color %>;">
        <%- val %>
      </span>

      <% if (!isSourceType) { %>
        <span class="CDB-Text CDB-Size-small u-lSpace--s u-flex" style="color: <%- color %>;">
          <i class="CDB-IconFont CDB-Size-small CDB-IconFont-ray"></i>
        </span>
      <% } %>

      <span class="CDB-Text CDB-Size-medium u-lSpace">
        <%= nodeTitle %>
      </span>

      <span class="CDB-Text CDB-Size-medium u-altTextColor u-ellipsis u-lSpace" title="<%= layerName %>">
        <%= layerName %>
      </span>
    </div>
  <% } else { %>
    <%- val %>
  <% } %>
</button>
