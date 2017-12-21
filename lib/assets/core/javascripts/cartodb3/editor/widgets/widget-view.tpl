<div class="BlockList-dragIcon">
  <div class="CDB-Shape">
    <div class="CDB-Shape-rectsHandle is-small">
      <div class="CDB-Shape-rectsHandleItem CDB-Shape-rectsHandleItem--grey is-first"></div>
      <div class="CDB-Shape-rectsHandleItem CDB-Shape-rectsHandleItem--grey is-second"></div>
      <div class="CDB-Shape-rectsHandleItem CDB-Shape-rectsHandleItem--grey is-third"></div>
    </div>
  </div>
</div>
<div class="BlockList-media u-rSpace--m js-widgetIcon">
</div>
<div class="BlockList-inner u-ellipsis">
  <div class="BlockList-title u-bSpace js-context-menu">
    <div class="BlockList-titleText js-header"></div>
  </div>
  <div class="u-flex u-alignCenter">
    <span class="CDB-Text CDB-Size-small is-semibold u-upperCase" style="color: <%- sourceColor %>;">
      <%- sourceId %>
    </span>

    <% if (!isSourceType) { %>
      <span class="CDB-Text CDB-Size-small u-lSpace--s u-flex" style="color: <%- sourceColor %>;">
        <i class="CDB-IconFont CDB-Size-small CDB-IconFont-ray"></i>
      </span>
    <% } %>

    <span class="CDB-Text CDB-Size-small u-mainTextColor u-lSpace">
      <%= sourceType %>
    </span>

    <span class="CDB-Text CDB-Size-small u-altTextColor u-ellipsis u-lSpace" title="<%= layerName %>">
      <%= layerName %>
    </span>
  </div>
</div>
