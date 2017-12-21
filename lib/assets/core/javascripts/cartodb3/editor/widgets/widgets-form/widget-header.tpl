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

    <div class="Editor-HeaderInfo u-flex">
      <p class="CDB-Text CDB-Size-small u-ellipsis">
        <span class="CDB-Text is-semibold u-rSpace--s u-upperCase" style="color: <%- sourceColor %>;"><%- source %></span>
        <a href="<%- url %>" target="_blank" title="<%- layerName %>" class="Editor-headerLayerName"><%- layerName %></a>
      </p>
    </div>
  </div>
</div>
