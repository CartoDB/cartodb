<button class="CDB-Button CDB-Button--primary u-rSpace js-ok track-DO track-export<% if (isLoading) { %> is-disabled <% } %>">
  <div class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase u-flex">
    <% if (isLoading) { %>
    <div class="CDB-LoaderIcon CDB-LoaderIcon--small u-iBlock">
      <svg class="CDB-LoaderIcon-spinner" viewBox="0 0 50 50">
        <circle class="CDB-LoaderIcon-path" cx="25" cy="25" r="20" fill="none"></circle>
      </svg>
    </div>
     <%- _t('editor.maps.export-image.generating') %>
    <% } else { %>
     <%- _t('editor.maps.export-image.export') %>
    <% } %>
  </div>
</button>
