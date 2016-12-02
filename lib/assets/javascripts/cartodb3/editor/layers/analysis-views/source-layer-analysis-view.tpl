<div class="Editor-ListAnalysis-itemInfo u-rSpace--m CDB-Text is-semibold CDB-Size-small u-altTextColor">
  <%- id %>
  <div class="CDB-Shape Editor-ListAnalysis-itemInfoIcon">
    <ul class="CDB-Shape-Dataset is-small is-grey">
      <li class="CDB-Shape-DatasetItem"></li>
      <li class="CDB-Shape-DatasetItem"></li>
    </ul>
  </div>
</div>
<p class="CDB-Text CDB-Size-small u-secondaryTextColor Editor-ListAnalysis-itemInfoDataset u-ellipsis">
  <%- tableName %>
</p>
<% if (isSync) { %>
  <span class="Editor-ListAnalysis-itemInfoIcon">
    <div class="u-flex u-alignCenter CDB-Text CDB-Size-small u-altTextColor SyncInfo-message--<%- state %> js-sync" data-tooltip="<% if (errorCode || errorMessage) { %><%- _t('dataset.sync.sync-failed') %><% } else { %><%- ranAt %><% } %>">
      <i class="CDB-IconFont CDB-IconFont-wifi"></i>
    </div>
  </span>
<% } %>
<% if (customQueryApplied) { %>
  <span class="Editor-ListAnalysis-itemInfoIcon Tag Tag--outline Tag-outline--dark CDB-Text CDB-Size-small">
    SQL
  </span>
<% } %>
