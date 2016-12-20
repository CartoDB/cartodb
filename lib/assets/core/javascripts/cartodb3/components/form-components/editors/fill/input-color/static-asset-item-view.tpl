<% if (type === 'icon') { %>
<div class="AssetItem-icon js-asset"><img src="<%- public_url %>" alt="<%- name %>" crossOrigin="anonymous" /></div>
<% } else { %>
<div class="AssetItem-label CDB-Text CDB-Size-small u-altTextColor u-upperCase js-asset" title="<%- name %>">
  <%- name %>
</div>
<% } %>
