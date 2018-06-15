<h4 class="CDB-Text CDB-Size-large u-mainTextColor u-secondaryTextColor u-bSpace--m u-tSpace-xl">
  <%- _t('components.modals.add-layer.datasets.no-datasets.title') %>
</h4>
<p class="CDB-Text CDB-Size-medium u-altTextColor">
  <% var connectDatasetHTML = '<button class="Button--link js-connect">' + _t('components.modals.add-layer.datasets.no-datasets.connect-datasets') + '</button>'; %>
  <% var searchHTML = '<strong>' + _t('components.modals.add-layer.datasets.no-datasets.search') + '</strong>'; %>
  <%= _t('components.modals.add-layer.datasets.no-datasets.desc', {
      connectDataset: connectDatasetHTML,
      search: searchHTML
    }) %>
</p>
<div class="NoDatasets-illustration"></div>
