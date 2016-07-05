<% if (!loading) { %>
<div class="CDB-Text CDB-Size-medium">
  <%= updatedOn %>
</div>
<% } else { %>
<div class="CDB-LoaderIcon is-dark">
  <svg class="CDB-LoaderIcon-spinner" viewBox="0 0 50 50">
    <circle class="CDB-LoaderIcon-path" cx="25" cy="25" r="20" fill="none"></circle>
  </svg>
</div>
<% } %>