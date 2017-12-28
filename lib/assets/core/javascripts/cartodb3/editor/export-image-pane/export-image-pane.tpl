<ul class="Editor-breadcrumb">
  <li class="Editor-breadcrumbItem CDB-Text CDB-Size-medium u-actionTextColor">
    <button class="js-back">
      <i class="CDB-IconFont CDB-IconFont-arrowPrev Size-large u-rSpace"></i>

      <span class="Editor-breadcrumbLink"><%- _t('back') %></span>
    </button>
  </li>

  <li class="Editor-breadcrumbItem CDB-Text CDB-Size-medium">
    <span class="Editor-breadcrumbSep"> / </span> <%- _t('editor.maps.export-image.title') %>
  </li>
</ul>

<div class="Editor-HeaderInfoEditor">
  <div class="Editor-HeaderInfo-inner Editor-HeaderInfo-inner--wide">
    <div class="Editor-HeaderInfo">
      <div class="CDB-Text CDB-Size-huge is-light u-ellipsis"><%- mapName %></div>
    </div>
  </div>
</div>

<div class="Editor-content js-content"></div>
<div class="js-disclaimer"></div>
<div class="Options-bar Options-bar--right u-flex js-footer"></div>
