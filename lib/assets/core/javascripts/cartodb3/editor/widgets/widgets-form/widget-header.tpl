<ul class="Editor-breadcrumb">
  <li class="Editor-breadcrumbItem CDB-Text CDB-Size-medium u-actionTextColor">
    <button class="js-back">
      <i class="CDB-IconFont CDB-IconFont-arrowPrev Size-large u-rSpace"></i>

      <span class="Editor-breadcrumbLink"><%- _t('back') %></span>
    </button>
  </li>

  <li class="Editor-breadcrumbItem CDB-Text CDB-Size-medium"><span class="Editor-breadcrumbSep"> / </span> <%- _t('editor.widgets.breadcrumb.widget-options') %></li>
</ul>

<div class="Editor-HeaderInfoEditor">
  <div class="Editor-HeaderInfo-inner Editor-HeaderInfo-inner--wide">
    <div class="Editor-HeaderInfo-title js-context-menu">
      <div class="Editor-HeaderInfo-titleText js-header"></div>
    </div>

    <div class="Editor-HeaderInfo u-flex u-alignCenter">
      <span class="CDB-Text CDB-Size-small is-semibold u-bSpace--s u-upperCase" style="color: <%- color %>;">
        <%- source %>
      </span>

      <% if (!isSourceType) { %>
        <span class="CDB-Text CDB-Size-small u-lSpace--s u-flex" style="color: <%- color %>;">
          <i class="CDB-IconFont CDB-Size-small CDB-IconFont-ray"></i>
        </span>
      <% } %>

      <span class="CDB-Text CDB-Size-small u-lSpace">
        <%= nodeTitle %>
      </span>

      <span class="CDB-Text CDB-Size-small u-altTextColor u-ellipsis u-lSpace" title="<%= layerName %>">
        <%= layerName %>
      </span>
    </div>
  </div>
</div>
