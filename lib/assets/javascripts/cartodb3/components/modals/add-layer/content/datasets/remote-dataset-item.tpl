<div class="DatasetsList-itemCategory is--<%- isRaster ? 'raster' : geometryType %>Dataset">
  <i data-title="Public dataset" class="CDB-IconFont CDB-IconFont-book DatasetsList-itemStatus <%- canImportDataset ? 'is-public' : 'is-banned' %>"></i>
</div>
<div class="DatasetsList-itemInfo">
  <div class="DatasetsList-itemPrimaryInfo">
    <h3 class="DatasetsList-itemTitle DefaultTitle u-ellipsLongText"><%- title %></h3>
    <% if (description && description.length > 0) { %>
      <p class="DefaultDescription DatasetsList-itemDescription u-ellipsLongText" title="<%- description %>"><%- description %></p>
    <% } else { %>
      <span class="NoResults"><%- _t('components.modals.add-layer.datasets.item.no-description')%></span>
    <% } %>
  </div>
  <div class="DatasetsList-itemSecondaryInfo">
    <ul class="DatasetsList-itemMeta">
      <% if (rowCount) { %>
        <label class="RowsIndicator">
          <i class="CDB-IconFont CDB-IconFont-rows RowsIndicator-icon"></i>
          <%- rowCountFormatted %> <%- _t('components.modals.add-layer.datasets.item.rows-pluralize', { smart_count: rowCount }) %>
        </label>
      <% } %>
      <% if (datasetSize) { %>
        <label class="SizeIndicator">
          <i class="CDB-IconFont CDB-IconFont-floppy SizeIndicator-icon"></i>
          <%- datasetSize %>
        </label>
      <% } %>
      <label class="DatasetsList-itemTimeDiff DefaultTimeDiff">
        <i class="CDB-IconFont CDB-IconFont-clock DefaultTimeDiff-icon"></i>
        <%- timeDiff %> <span class="DatasetsList-itemSource js-source"><% if (source) { %><%- _t('components.modals.add-layer.datasets.item.from') %> <%= cdb.core.sanitize.html(source) %><% } %></span>
      </label>
    </ul>
    <div class="DatasetsList-itemMeta DatasetsList-itemTags">
      <% if (tagsCount > 0) { %>
        <div class="DefaultTags">
          <% for (var i = 0, l = Math.min(maxTagsToShow, tags.length); i < l; ++i) { %>
            <button class="DefaultTags-item js-tag-link" value="<%- tags[i] %>"><%- tags[i] %></button><% if (i !== (l-1)) { %>,<% } %>
          <% } %>
          <% if (tagsCount > maxTagsToShow) { %>
            <%- _t('components.modals.add-layer.datasets.item.tags-more', { tagsCount: tagsCount - maxTagsToShow }) %>
          <% } %>
        </div>
      <% } else { %>
        <span class="NoResults"><%- _t('components.modals.add-layer.datasets.item.no-tags') %></span>
      <% } %>
    </div>
  </div>
</div>
