<div class="Dialog-header ErrorDetails-header">
  <div class="Dialog-headerIcon Dialog-headerIcon--negative">
    <i class="CDB-IconFont CDB-IconFont-cloud"></i>
  </div>
  <p class="Dialog-headerTitle">
    <%- title %> <% if (errorCode) { %>(<%- errorCode %>)<% } %>
  </p>
  <p class="Dialog-headerText">
    <% if (itemQueueId) { %>
    <%- _t('components.background-importer.error-details.dont-panic') %>
    <% } else { %>
    <%- _t('components.background-importer.error-details.check-errors') %>
    <% } %>
  </p>
</div>
<div class="Dialog-body ErrorDetails-body">
  <ul class="ErrorDetails-list">
    <% if (httpResponseCode) { %>
      <li class="ErrorDetails-item">
        <div class="ErrorDetails-itemStep">1</div>
        <div class="ErrorDetails-itemText">
          <%- _t('components.background-importer.error-details.remote-server-code', { httpResponseCode: httpResponseCode }) %> <%- httpResponseCodeMessage %>
        </div>
      </li>
      <li class="ErrorDetails-item">
        <div class="ErrorDetails-itemStep">2</div>
        <div class="ErrorDetails-itemText">
          <%- _t('components.background-importer.error-details.check-url') %>:<br/>
          <span class="ErrorDetails-itemTextStrong"><a href="<%- originalUrl %>"><%- originalUrl %></a></span>
        </div>
      </li>
    <% } else { %>
      <li class="ErrorDetails-item">
        <div class="ErrorDetails-itemStep">1</div>
        <div class="ErrorDetails-itemText">
          <% if (text) { %>
          <%= cdb.core.sanitize.html(text) %>
          <% } else { %>
          <%- _t('components.background-importer.error-details.unknown-error') %>
          <% } %>
        </div>
      </li>
    <% } %>
    <% if (itemQueueId) { %>
      <li class="ErrorDetails-item">
        <div class="ErrorDetails-itemStep">!</div>
        <div class="ErrorDetails-itemText">
          <%- _t('components.background-importer.error-details.send-us-the-error-code') %>:<br/>
          <span class="ErrorDetails-itemTextStrong"><%- itemQueueId %></span>
        </div>
      </li>
    <% } %>
  </ul>
</div>
<div class="Dialog-footer ErrorDetails-footer">
  <button class="Button Button--secondary ErrorDetails-footerButton js-close">
    <span><%- _t('components.background-importer.error-details.close') %></span>
  </button>
</div>
