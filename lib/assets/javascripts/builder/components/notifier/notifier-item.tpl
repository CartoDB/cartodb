<div class="Notifier-item Notifier-item--<%- status %>">

  <% if (status === 'loading') { %>
  <div class="Notifier-icon CDB-LoaderIcon is-blue js-theme u-rSpace--m">
    <svg class="CDB-LoaderIcon-spinner" viewBox="0 0 50 50">
      <circle class="CDB-LoaderIcon-path" cx="25" cy="25" r="20" fill="none"></circle>
    </svg>
  </div>
  <% } %>

  <% if (status === 'success') { %>
  <div class="Notifier-icon CDB-Shape u-rSpace--m">
    <div class="CDB-Shape-CircleItem CDB-Shape-CircleItem--fill is-green">
      <div class="CDB-Shape-tick is-medium is-white"></div>
    </div>
  </div>
  <% } %>

  <% if (status === 'error' || status === 'warning') { %>
  <div class="Notifier-icon CDB-Shape u-rSpace--m">
    <div class="CDB-Shape-CircleItem CDB-Shape-CircleItem--fill is-red">
      <div class="CDB-Shape-close is-medium is-white"></div>
    </div>
  </div>
  <% } %>

  <div class="Notifier-info">
    <p class="CDB-Text CDB-Size-medium"><%= info %> <% if (isActionable) { %> <span class="js-actionButton"></span> <% } %></p>
  </div>

  <% if (isClosable) { %>
    <div class="Notifier-actions js-closeButton"></div>
  <% } %>
</div>
