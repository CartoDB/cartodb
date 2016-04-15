<div class="DatasetsList-itemCategory is--<%- isRaster ? 'raster' : geometryType %>Dataset">
  <i data-title="Public dataset" class="CDB-IconFont CDB-IconFont-book DatasetsList-itemStatus <%- canImportDataset ? 'is-public' : 'is-banned' %>"></i>
</div>
<div class="ModalDataset-itemInfo">
  <div class="ModalDataset-itemInfoTitle">
    <h3 class="CDB-Text CDB-Size-large u-bSpace u-ellipsis"><%- title %></h3>
    <% if (description && description.length > 0) { %>
      <p class="u-ellipsis CDB-Text CDB-Size-medium u-altTextColor" title="<%- description %>"><%- description %></p>
    <% } else { %>
      <span class="NoResults CDB-Text CDB-Size-medium"><%- _t('components.modals.add-layer.datasets.item.no-description')%></span>
    <% } %>
  </div>
  <div>
    <ul class="DatasetsList-itemMeta CDB-Text CDB-Size-small u-altTextColor">
      <% if (rowCount) { %>
        <li class="RowsIndicator">
          <%- rowCountFormatted %> <%- _t('components.modals.add-layer.datasets.item.rows-pluralize', { smart_count: rowCount }) %>
        </li>
      <% } %>
      <% if (datasetSize) { %>
        <li class="SizeIndicator">
          <%- datasetSize %>
        </li>
      <% } %>
      <li class="DatasetsList-itemTimeDiff DefaultTimeDiff CDB-Text CDB-Size-small u-altTextColor">
        <%- timeDiff %> <span class="DatasetsList-itemSource js-source"><% if (source) { %><%- _t('components.modals.add-layer.datasets.item.from') %> <%= cdb.core.sanitize.html(source) %><% } %></span>
      </li>
    </ul>
    <div class="DatasetsList-itemMeta DatasetsList-itemTags">
      <% if (tagsCount > 0) { %>
        <div class="DefaultTags CDB-Text CDB-Size-small">
          <% for (var i = 0, l = Math.min(maxTagsToShow, tags.length); i < l; ++i) { %>
            <button class="DefaultTags-item js-tag-link" value="<%- tags[i] %>"><%- tags[i] %></button><% if (i !== (l-1)) { %>,<% } %>
          <% } %>
          <% if (tagsCount > maxTagsToShow) { %>
            <%- _t('components.modals.add-layer.datasets.item.tags-more', { tagsCount: tagsCount - maxTagsToShow }) %>
          <% } %>
        </div>
      <% } else { %>
        <span class="NoResults CDB-Text CDB-Size-small u-altTextColor"><%- _t('components.modals.add-layer.datasets.item.no-tags') %></span>
      <% } %>
    </div>
  </div>
</div>
