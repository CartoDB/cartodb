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
<div class="DatasetsList-itemInfo">
  <div class="DatasetsList-itemPrimaryInfo">
    <h3 class="DatasetsList-itemTitle DefaultTitle u-ellipsLongText">
      <%- title %>
      <% if (showPermissionIndicator) { %>
        <span class="DatasetsList-itemTitlePermission PermissionIndicator u-upperCase">
          <%- _t('components.modals.add-layer.datasets.item.read') %>
        </span>
      <% } %>
    </h3>
    <% if (description && description.length > 0) { %>
      <p class="DefaultDescription DatasetsList-itemDescription u-ellipsLongText" title="<%- description %>"><%- description %></p>
    <% } else { %>
      <span class="NoResults DatasetsList-itemDescription"><%- _t('components.modals.add-layer.datasets.item.no-description') %></span>
    <% } %>
  </div>
  <div class="DatasetsList-itemSecondaryInfo">
    <div class="DatasetsList-itemMeta">
      <span class="PrivacyIndicator is-<%- privacy %>"><%- privacy %></span>
      <span class="js-likes-indicator" />
      <% if (rowCount) { %>
        <span class="RowsIndicator">
          <i class="CDB-IconFont CDB-IconFont-rows RowsIndicator-icon"></i>
          <%- rowCountFormatted %> <%- _t('components.modals.add-layer.datasets.item.rows-pluralize', { smart_count: rowCount }) %>
        </span>
      <% } %>
      <% if (datasetSize) { %>
        <span class="SizeIndicator">
          <i class="CDB-IconFont CDB-IconFont-floppy SizeIndicator-icon"></i>
          <%- datasetSize %>
        </span>
      <% } %>
      <span class="DatasetsList-itemTimeDiff DefaultTimeDiff">
        <i class="CDB-IconFont CDB-IconFont-clock DefaultTimeDiff-icon"></i>
          <%- timeDiff %>
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
