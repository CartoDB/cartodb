<div class="AssetItem-label CDB-Text CDB-Size-big <% if (type === 'icon') { %>u-mainTextColor<% } else { %>u-actionTextColor<% } %> u-upperCase js-asset" title="<%- name %>">
  <% if (type === 'icon' || type === 'file') { %>
    <img height="<%- height %>" src="<%- public_url %>" alt="<%- name %>" />
  <% } else { %>
    <%- name %>
  <% } %>
</div>
