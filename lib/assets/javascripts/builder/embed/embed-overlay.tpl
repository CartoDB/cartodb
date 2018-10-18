<div class="CDB-Overlay-title<% if (!description && !legends) { %> is-collapsed<% } %>">
  <h1 class="CDB-Text CDB-Size-large u-ellipsis" title="<%= title %>"><%= title %></h1>

  <% if (description || legends) { %>
    <div class="CDB-Overlay-options">
      <button class="CDB-Shape js-toggle u-lSpace">
        <div class="CDB-ArrowToogle is-blue is-down is-mini"></div>
      </button>
    </div>
  <% } %>
</div>

<% if (description || legends) { %>
  <div class="CDB-Overlay-inner is-active<% if (!legends) { %> is-description<% } %>">
    <% if (description) { %><div class="CDB-Embed-description<% if (legends) { %> is-legends<% } %> CDB-Text CDB-Size-medium u-altTextColor" title="<%= description %>"><%= description %></div><% } %>
  </div>
<% } %>
