<div class="Dialog-header">
  <div class="Dialog-headerIcon Dialog-headerIcon--negative u-flex u-alignCenter u-justifyCenter">
    <i class="CDB-IconFont CDB-IconFont-cloud"></i>
  </div>
  <h2 class="CDB-Text CDB-Size-large u-bSpace u-errorTextColor">
    <%- title %> <% if (errorCode) { %>(<%- errorCode %>)<% } %>
  </h2>
  <h3 class="CDB-Text CDB-Size-medium u-secondaryTextColor">
    <% if (itemQueueId) { %>
    <%- _t('components.background-importer.error-details.dont-panic') %>
    <% } else { %>
    <%- _t('components.background-importer.error-details.check-errors') %>
    <% } %>
  </h3>
</div>

<div class="Dialog-body ErrorDetails-body">
  <ul class="Modal-containerList">
    <% if (httpResponseCode) { %>
      <li class="ErrorDetails-item">
        <div class="ErrorDetails-itemStep CDB-Text CDB-Size-medium is-semibold u-flex u-alignCenter u-justifyCenter">1</div>
        <div class="ErrorDetails-itemText">
          <p class="CDB-Text CDB-Size-medium">
            <%= _t('components.background-importer.error-details.remote-server-code', { httpResponseCode: httpResponseCode}) %> <%- httpResponseCodeMessage %>
          </p>
        </div>
      </li>
      <li class="ErrorDetails-item">
        <div class="ErrorDetails-itemStep CDB-Text CDB-Size-medium is-semibold u-flex u-alignCenter u-justifyCenter">2</div>
        <div class="ErrorDetails-itemText">
          <p class="CDB-Text CDB-Size-medium">
            <%- _t('components.background-importer.error-details.check-url') %>:<br/>
          </p>
          <span class='CDB-Text CDB-Size-medium ErrorDetails-itemTextStrong'><a href="<%- originalUrl %>"><%- originalUrl %></a></span>
        </div>
      </li>
    <% } else { %>
      <li class="ErrorDetails-item">
        <div class="ErrorDetails-itemStep CDB-Text CDB-Size-medium is-semibold u-flex u-alignCenter u-justifyCenter">1</div>
        <div class="ErrorDetails-itemText">
          <p class="CDB-Text CDB-Size-medium">
            <% if (text) { %>
            <%= cdb.core.sanitize.html(text) %>
            <% } else { %>
            <%- _t('components.background-importer.error-details.unknown-error') %>
            <% } %>
          </p>
        </div>
      </li>
    <% } %>
    <% if (itemQueueId) { %>
      <li class="ErrorDetails-item">
        <div class="ErrorDetails-itemStep CDB-Text CDB-Size-medium is-semibold u-flex u-alignCenter u-justifyCenter">!</div>
        <div class="ErrorDetails-itemText">
          <p class="CDB-Text CDB-Size-medium">
            <%= _t('components.background-importer.error-details.send-us-the-error-code') %>:<br/>
          </p>
          <span class="CDB-Text CDB-Size-medium ErrorDetails-itemTextStrong"><%- itemQueueId %></span>
        </div>
      </li>
    <% } %>
  </ul>
</div>


<div class="Dialog-footer--simple u-inner">
  <button class="CDB-Button CDB-Button--error u-tSpace--m js-close">
    <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium u-upperCase">
      <%- _t('components.background-importer.error-details.close') %>
    </span>
  </button>
</div>