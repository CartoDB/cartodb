<li class="Notifier-item <%- (state === 'loading') ? 'is-working' : ''%>">

  <% if (state === 'loading') { %>
  <div class="CDB-LoaderIcon u-rSpace--m js-theme">
    <div class="CDB-LoaderIcon-item">
      <span class="CDB-LoaderIcon-itemClose"></span>
      <span class="CDB-LoaderIcon-itemCircle"></span>
    </div>
  </div>
  <% } %>

  <% if (state === 'success') { %>
  <div class="CDB-Shape u-rSpace--m">
    <div class="CDB-Shape-CircleItem is-green is-medium">
      <div class="CDB-Shape-tick is-medium is-green"></div>
    </div>
  </div>
  <% } %>

  <% if (state === 'error') { %>
  <div class="CDB-Shape u-rSpace--m">
    <div class="CDB-Shape-CircleItem is-red">
      <div class="CDB-Shape-close is-medium is-red"></div>
    </div>
  </div>
  <% } %>

  <div class="CDB-BoxLoader-info">
    <p class="CDB-Text CDB-Size-medium"><%- info %></p>
  </div>

  <% if (hasAction) { %>
    <div class="Notifier-actions js-actions"></div>
  <% } %>
</li>