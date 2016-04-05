<div class="ImportItem-text is-long">
  <% if (isUpgradeable) { %>
  In a hurry? <a href="<%- upgradeUrl %>">Upgrade your account</a> to import several files at a time
  <% } else { %>
  Unfortunately you can only import up to <%- importQuota %> files at the same time
  <% } %>
</div>
