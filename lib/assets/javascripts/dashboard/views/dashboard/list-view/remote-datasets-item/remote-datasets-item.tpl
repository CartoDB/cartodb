<div class="DatasetsList-fake"></div>
<div class="DatasetsList-itemCategory is--<%- isRaster ? 'raster' : geometryType %>Dataset">
  <i data-title="Public dataset" class="CDB-IconFont CDB-IconFont-book DatasetsList-itemStatus <%- canImportDataset ? 'is-public' : 'is-banned' %>"></i>
</div>
<div class="DatasetsList-itemInfo">
  <div class="DatasetsList-itemPrimaryInfo">
    <h3 class="u-ellipsis CDB-Text CDB-Size-large u-mainTextColor"><%- title %></h3>
    <% if (description && description.length > 0) { %>
      <p class="DefaultDescription CDB-Text CDB-Size-medium u-secondaryTextColor u-ellipsis" title="<%- description %>"><%- description %></p>
    <% } else { %>
      <span class="CDB-Text CDB-Size-medium u-altTextColor">No description</span>
    <% } %>
  </div>
  <div class="DatasetsList-itemSecondaryInfo">
    <ul class="DatasetsList-itemMeta CDB-Text CDB-Size-small u-secondaryTextColor">
      <% if (rowCount) { %>
        <li>
          <%- rowCount %> <%- pluralizedRows %>
        </li>
      <% } %>
      <% if (datasetSize) { %>
        <li>
          <%- datasetSize %>
        </label>
      <% } %>
      <li class="u-flex">
        <%- timeDiff %> <span class="DatasetsList-itemSource js-source"><% if (source) { %>from&nbsp;<%= cdb.core.sanitize.html(source) %><% } %></span>
      </li>
    </ul>
    <div class="DatasetsList-itemMeta">
      <% if (tagsCount > 0) { %>
        <div class="DefaultTags DatasetsList-itemTags">
          <% for (var i = 0, l = Math.min(maxTagsToShow, tags.length); i < l; ++i) { %>
            <a class="CDB-Tag CDB-Text CDB-Size-small is-semibold u-upperCase js-tag-link" href="<%- router.currentUrl({ search: ':'+ tags[i], library: false, page: 1 }) %>"><%- tags[i] %></a><% if (i !== (l-1)) { %>,<% } %>
          <% } %>
          <% if (tagsCount > maxTagsToShow) { %>
            and <%- tagsCount - maxTagsToShow %> more
          <% } %>
        </div>
      <% } else { %>
        <span class="DefaultDescription CDB-Text CDB-Size-small u-altTextColor u-ellipsis">No tags</span>
      <% } %>
    </div>
  </div>
</div>
