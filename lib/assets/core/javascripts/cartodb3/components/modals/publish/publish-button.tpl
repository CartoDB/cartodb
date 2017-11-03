<button class="Publish-modalButton CDB-Button CDB-Button--loading CDB-Button--primary CDB-Button--small u-rSpace js-button
  <% if (isDisabled) {%> is-disabled<% } %>
  <% if (isLoading) {%> is-loading<% } %>
">
  <div class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase">
    <% if (isPublished) { %>
    <%- _t('components.modals.publish.update-btn') %>
    <% } else { %>
    <%- _t('components.modals.publish.publish-btn') %>
    <% } %>
  </div>
  <div class="CDB-Button-loader CDB-LoaderIcon CDB-LoaderIcon--small is-white">
    <svg class="CDB-LoaderIcon-spinner" viewbox="0 0 50 50">
      <circle class="CDB-LoaderIcon-path" cx="25" cy="25" r="20" fill="none"/>
    </svg>
  </div>
</button> <%- publishedOn %>
