<div class="DatasetsList-itemCategory is--<%- isRaster ? 'raster' : geometryType %>Dataset">
  <% if (syncStatus) { %>
    <i
    <% if (syncStatus === "failure") { %>
      data-title="<%- _t('components.modals.add-layer.datasets.item.sync-failed') %> <%- syncRanAt %>"
    <% } else if (syncStatus === "syncing") { %>
      data-title="<%- _t('components.modals.add-layer.datasets.item.syncing') %>"
    <% } else { %>
      data-title="<%- _t('components.modals.add-layer.datasets.item.synced') %> <%- syncRanAt %>"
    <% } %>
    class="CDB-IconFont CDB-IconFont-wifi DatasetsList-itemStatus is-<%- syncStatus %>"></i>
  <% } %>
</div>
<div class="ModalDataset-itemInfo">
  <div>
    <h3 class="CDB-Text CDB-Size-large u-bSpace">
      <%- title %>
      <% if (showPermissionIndicator) { %>
        <span class="DatasetsList-itemTitlePermission PermissionIndicator u-upperCase">
          <%- _t('components.modals.add-layer.datasets.item.read') %>
        </span>
      <% } %>
    </h3>
    <% if (description && description.length > 0) { %>
      <p class="u-ellipsLongText CDB-Text CDB-Size-medium u-altTextColor" title="<%- description %>"><%- description %></p>
    <% } else { %>
      <span class="NoResults CDB-Text CDB-Size-medium"><%- _t('components.modals.add-layer.datasets.item.no-description') %></span>
    <% } %>
  </div>
  <div>
    <div class="DatasetsList-itemMeta">

      <span class="CDB-Tag is-<%- privacy %> CDB-Text is-semibold CDB-Size-small u-upperCase">
        <%- privacy %>
      </span>
      <% if (rowCount) { %>
        <span class="RowsIndicator">
          <span class="CDB-Text CDB-Size-small u-altTextColor"><%- rowCountFormatted %> <%- _t('components.modals.add-layer.datasets.item.rows-pluralize', { smart_count: rowCount }) %></span>
        </span>
      <% } %>
      <% if (datasetSize) { %>
        <span class="SizeIndicator">
          <span class="CDB-Text CDB-Size-small u-altTextColor"><%- datasetSize %></span>
        </span>
      <% } %>
      <span class="DatasetsList-itemTimeDiff DefaultTimeDiff">
        <span class="CDB-Text CDB-Size-small u-altTextColor"><%- timeDiff %></span>
        <% if (!isOwner) { %>
          <%- _t('components.modals.add-layer.datasets.item.by') %>
          <span class="UserAvatar">
            <img class="UserAvatar-img UserAvatar-img--smaller" src="<%- owner.avatar_url %>" alt="<%- owner.name || owner.username  %>" title="<%- owner.name || owner.username  %>" />
          </span>
        <% } %>
      </span>
    </div>
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
