<ul class="Editor-breadcrumb">
  <li class="Editor-breadcrumbItem CDB-Text CDB-Size-medium u-actionTextColor">
    <button class="js-back">
      <i class="CDB-IconFont CDB-IconFont-arrowPrev Size-large u-rSpace"></i>

      <span class="Editor-breadcrumbLink"><%- _t('back') %></span>
    </button>
  </li>

  <li class="Editor-breadcrumbItem CDB-Text CDB-Size-medium">
    <span class="Editor-breadcrumbSep"> / </span>
    <%- breadcrumbLabel %>
  </li>
</ul>

<div class="Editor-HeaderInfoEditor Editor-HeaderInfoEditor--layer">
  <div class="Editor-HeaderInfo-inner Editor-HeaderInfo-inner--wide u-ellipsis">
    <div class="Editor-HeaderInfo-title u-bSpace">
      <span class="CDB-SelectorLayer-letter CDB-Text CDB-Size-small u-whiteTextColor u-tSpace--m u-rSpace--m u-upperCase" style="background-color: <%- bgColor %>;">
        <%- letter %>
      </span>

      <h2 class="Inline-editor">
        <div class="CDB-Text CDB-Size-huge is-light u-ellipsis">
          <%- layerName %>
        </div>
      </h2>
    </div>

    <div class="Editor-HeaderInfo-source u-flex">
      <p class="CDB-Text CDB-Size-small u-ellipsis">
        <a href="<%- url %>" target="_blank" title="<%- tableName %>" class="Editor-headerLayerName"><%- tableName %></a>
      </p>
    </div>
  </div>
  
  <div class="u-flex u-tSpace-xl js-context-menu"></div>
</div>
