<p class="Editor-ListAnalysis-itemInfoTitle CDB-Text CDB-Size-small u-ellipsis u-flex" title="<%- tableName %>">
  <span class="CDB-Text is-semibold CDB-Size-small u-rSpace u-upperCase"  style="color: <%- bgColor %>">
    <%- id %>
  </span>
  Source
  <span class="Editor-ListAnalysis-title u-altTextColor u-lSpace u-ellipsis">
    <%- tableName %>
  </span>
</p>
<% if (isSync) { %>
  <span class="Editor-ListAnalysis-itemInfoIcon">
    <div class="u-flex u-alignCenter CDB-Text CDB-Size-small u-altTextColor SyncInfo-message--<%- state %> js-sync" data-tooltip="<% if (errorCode || errorMessage) { %><%- _t('dataset.sync.sync-failed') %><% } else { %><%- modifiedAt || ranAt %><% } %>">
      <i class="CDB-IconFont CDB-IconFont-wifi"></i>
    </div>
  </span>
<% } %>
<% if (customQueryApplied) { %>
  <span class="Editor-ListAnalysis-itemInfoIcon Tag Tag--outline Tag-outline--dark CDB-Text CDB-Size-small js-sql">
    SQL
  </span>
<% } %>
