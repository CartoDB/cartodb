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
    <div class="u-flex">
      <span
        class="SelectorLayer-letter CDB-Text CDB-Size-small u-whiteTextColor u-rSpace u-upperCase"
        style="background-color: <%- color %>;"><%- val %></span>
        <p class="CDB-Text CDB-Size-medium u-ellipsis u-flex" title="<%- nodeTitle %> - <%- layerName %>">
          <%- nodeTitle %> <span class="u-altTextColor u-lSpace u-ellipsis"><%- layerName %></span>
        </p>
    </div>
  <% } else { %>
    <%- label %>
  <% } %>
<% } %>
