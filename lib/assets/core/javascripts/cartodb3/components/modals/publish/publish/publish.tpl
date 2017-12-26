<ul class="Publish-optionsList u-flex u-justifySpace js-list"></ul>
<% if (!isPublished) { %>
<div class="Share-info">
  <div>
    <h2 class="CDB-Text CDB-Size-large u-secondaryTextColor u-bSpace is-light"><%- _t('components.modals.publish.share.unpublished-header') %></h2>
    <p class="CDB-Text CDB-Size-medium is-light"><%- _t('components.modals.publish.share.unpublished-subheader') %></p>
  </div>
</div>
<% } %>
