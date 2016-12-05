<% if (type == 'icon') { %>
<div class="AssetItem-icon js-asset" style="background-image:url(<%- public_url %>)" title="<%- name %>"></div>
<% } else { %>
<div class="AssetItem-icon CDB-Text CDB-Size-small u-altTextColor u-upperCase js-asset" title="<%- name %>">
  <div class="CDB-Text CDB-Size-small u-altTextColor u-upperCase">
    <%- name %>
  </div>
</div>
<% } %>
