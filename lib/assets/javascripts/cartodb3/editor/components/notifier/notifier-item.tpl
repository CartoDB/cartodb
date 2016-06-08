<li class="Notifier-item <%- (status === 'loading') ? 'is-working' : ''%>">

  <% if (status === 'loading') { %>
  <div class="Notifier-icon CDB-LoaderIcon u-rSpace--m js-theme">
    <div class="CDB-LoaderIcon-item">
      <span class="CDB-LoaderIcon-itemClose"></span>
      <span class="CDB-LoaderIcon-itemCircle"></span>
    </div>
  </div>
  <% } %>

  <% if (status === 'success') { %>
  <div class="Notifier-icon CDB-Shape u-rSpace--m">
    <div class="CDB-Shape-CircleItem is-green is-medium">
      <div class="CDB-Shape-tick is-medium is-green"></div>
    </div>
  </div>
  <% } %>

  <% if (status === 'error') { %>
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