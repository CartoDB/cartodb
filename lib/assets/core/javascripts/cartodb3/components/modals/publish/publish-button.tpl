<button class="Publish-modalButton CDB-Button CDB-Button--primary CDB-Button--small u-rSpace js-button <% if (isDisabled) {%>is-disabled<% } %>">
  <div class="CDB-Button-Text CDB-Text is-semibold CDB-Size-small u-upperCase u-flex">
    <% if (isLoading) { %>
      <div class="CDB-LoaderIcon CDB-LoaderIcon--small u-iBlock">
        <svg class="CDB-LoaderIcon-spinner" viewBox="0 0 50 50">
          <circle class="CDB-LoaderIcon-path" cx="25" cy="25" r="20" fill="none"></circle>
        </svg>
      </div>
      <% if (isPublished) { %>
      <%- _t('components.modals.publish.updating-btn') %>
      <% } else { %>
      <%- _t('components.modals.publish.publishing-btn') %>
      <% } %>
    <% } else { %>
      <% if (isPublished) { %>
      <%- _t('components.modals.publish.update-btn') %>
      <% } else { %>
      <%- _t('components.modals.publish.publish-btn') %>
      <% } %>
    <% } %>
  </div>
</button> <%- publishedOn %>