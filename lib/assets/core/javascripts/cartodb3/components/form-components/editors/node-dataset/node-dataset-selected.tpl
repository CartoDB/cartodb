<% if (typeof isLoading != 'undefined' && isLoading) { %>
  <div class="u-flex">
    <div class="CDB-LoaderIcon CDB-LoaderIcon--small is-dark">
      <svg class="CDB-LoaderIcon-spinner" viewBox="0 0 50 50">
        <circle class="CDB-LoaderIcon-path" cx="25" cy="25" r="20" fill="none"></circle>
      </svg>
    </div>
    <span class="u-lSpace u-secondaryTextColor"><%- _t('components.backbone-forms.select.loading') %></span>
  </div>
<% } else { %>
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
    <%- label %>
  <% } %>
<% } %>
