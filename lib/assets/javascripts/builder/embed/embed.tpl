<% if (showMenu && showLegends) { %>
  <header class="CDB-Embed-header">
    <h1 class="CDB-Text CDB-Size-large u-ellipsis" title="<%= title %>"><%= title %></h1>
    <% if (description) { %><div class="CDB-Embed-description CDB-Text CDB-Size-medium u-altTextColor" title="<%= description %>"><%= description %></div><% } %>
  </header>
<% } %>

<% if (showLegends) { %>
  <div class="CDB-Embed-tabs CDB-NavMenu js-tabs"></div>
<% } %>

<div class="CDB-Embed-content">
  <div class="CDB-Embed-tab is-active js-embed-map"></div>

  <% if (showLegends) { %>
    <div class="CDB-Embed-tab CDB-Embed-legends js-embed-legends"></div>
  <% } %>
</div>
