<li class="Notifier-item <%- (status === 'loading') ? 'is-working' : ''%>">

  <% if (status === 'loading') { %>
  <div class="Notifier-icon CDB-LoaderIcon is-dark js-theme u-rSpace--m">
    <svg class="CDB-LoaderIcon-spinner" viewBox="0 0 50 50">
      <circle class="CDB-LoaderIcon-path" cx="25" cy="25" r="20" fill="none"></circle>
    </svg>
  </div>
  <% } %>

  <% if (status === 'success') { %>
  <div class="Notifier-icon CDB-Shape u-rSpace--m">
    <div class="CDB-Shape-CircleItem is-green is-medium">
      <div class="CDB-Shape-tick is-medium is-green"></div>
    </div>
  </div>
  <% } %>

  <% if (status === 'error' || status === 'warning') { %>
  <div class="Notifier-icon CDB-Shape u-rSpace--m">
    <div class="CDB-Shape-CircleItem is-red">
      <div class="CDB-Shape-close is-medium is-red"></div>
    </div>
  </div>
  <% } %>

  <div class="Notifier-info">
    <p class="CDB-Text CDB-Size-medium"><%= info %></p>
  </div>

  <% if (isActionable) { %>
    <div class="Notifier-actions js-actionButton"></div>
  <% } %>

  <% if (isClosable) { %>
    <div class="Notifier-actions js-closeButton"></div>
  <% } %>
</li>