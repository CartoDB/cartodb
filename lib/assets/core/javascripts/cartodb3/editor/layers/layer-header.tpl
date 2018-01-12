<ul class="Editor-breadcrumb">
  <li class="Editor-breadcrumbItem CDB-Text CDB-Size-medium u-actionTextColor">
    <button class="js-back">
      <i class="CDB-IconFont CDB-IconFont-arrowPrev Size-large u-rSpace"></i>

      <span class="Editor-breadcrumbLink"><%- _t('back') %></span>
    </button>
  </li>

  <li class="Editor-breadcrumbItem CDB-Text CDB-Size-medium"><span class="Editor-breadcrumbSep"> / </span> <%- _t('editor.layers.breadcrumb.layer-options') %></li>
</ul>

<div class="Editor-HeaderInfoEditor Editor-HeaderInfoEditor--layer">
  <div class="Editor-HeaderInfo-inner u-ellipsis">
    <div class="Editor-HeaderInfo-title u-bSpace js-header">
      <span class="CDB-SelectorLayer-letter CDB-Text CDB-Size-small u-whiteTextColor u-tSpace--m u-rSpace--m u-upperCase" style="background-color: <%- bgColor %>;">
        <%- letter %>
      </span>
    </div>

    <% if (isTableSource) { %>
      <div class="Editor-HeaderInfo-source u-flex">
        <p class="CDB-Text CDB-Size-small u-ellipsis">
          <a href="<%- url %>" target="_blank" title="<%- tableName %>" class="Editor-headerLayerName"><%- tableName %></a>
        </p>
      </div>
    <% } %>
  </div>

  <ul class="u-flex u-tSpace-xl">
    <% if (!hasGeometry) { %>
      <li class="Editor-HeaderInfo-noGeometry js-nogeometrylayer">
        <svg width="12px" height="12px" viewBox="0 0 500 500" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
          <title>icon-font_114_Warning</title>
          <defs></defs>
          <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
            <g id="Artboard-1" transform="translate(-9001.000000, -11000.000000)" fill-rule="nonzero" fill="#FEB100">
              <g id="icon-font_114_Warning" transform="translate(9001.000000, 11000.000000)">
                <path d="M47.3618699,443.171714 C40.4022689,456.721101 41.0006423,457.65748 56.75075,457.65748 L441.243856,457.65748 C456.985511,457.65748 457.59007,456.716689 450.632737,443.171714 L248.997303,50.6152213 L47.3618699,443.171714 Z M210.115762,31.2931921 C231.589444,-10.5131174 266.489496,-10.3489299 287.878844,31.2931921 L489.747111,424.302981 C511.220794,466.109288 489.302388,500 441.243856,500 L56.75075,500 C8.48945932,500 -13.1418536,465.945101 8.24749422,424.302981 L210.115762,31.2931921 Z M222.781864,372.97244 L222.781864,415.31496 L266.474263,415.31496 L266.474263,372.97244 L222.781864,372.97244 Z M222.781864,203.602361 L222.781864,330.62992 L266.474263,330.62992 L266.474263,203.602361 L222.781864,203.602361 Z" id="Combined-Shape"></path>
              </g>
            </g>
          </g>
        </svg>
      </li>
    <% } %>
    <li class="u-rSpace">
      <button class="Editor-HeaderInfo-zoom CDB-Shape js-zoom">
        <svg width="16px" height="15px" viewBox="287 30 16 15" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
          <g id="Icon" stroke="none" stroke-width="1" fill-rule="evenodd" transform="translate(288.000000, 30.000000)">
            <circle id="Oval" cx="7.5" cy="7.5" r="0.5"></circle>
            <path d="M7,0 L8,0 L8,5 L7,5 L7,0 Z M6,3 L7,3 L7,4 L6,4 L6,3 Z M8,3 L9,3 L9,4 L8,4 L8,3 Z M9,2 L10,2 L10,3 L9,3 L9,2 Z M5,2 L6,2 L6,3 L5,3 L5,2 Z" id="Combined-Shape"></path>
            <path d="M7,10 L8,10 L8,15 L7,15 L7,10 Z M6,13 L7,13 L7,14 L6,14 L6,13 Z M8,13 L9,13 L9,14 L8,14 L8,13 Z M9,12 L10,12 L10,13 L9,13 L9,12 Z M5,12 L6,12 L6,13 L5,13 L5,12 Z" id="Combined-Shape" transform="translate(7.500000, 12.500000) scale(1, -1) translate(-7.500000, -12.500000) "></path>
            <path d="M12,5 L13,5 L13,10 L12,10 L12,5 Z M11,8 L12,8 L12,9 L11,9 L11,8 Z M13,8 L14,8 L14,9 L13,9 L13,8 Z M14,7 L15,7 L15,8 L14,8 L14,7 Z M10,7 L11,7 L11,8 L10,8 L10,7 Z" id="Combined-Shape" transform="translate(12.500000, 7.500000) scale(1, -1) rotate(90.000000) translate(-12.500000, -7.500000) "></path>
            <path d="M2,5 L3,5 L3,10 L2,10 L2,5 Z M1,8 L2,8 L2,9 L1,9 L1,8 Z M3,8 L4,8 L4,9 L3,9 L3,8 Z M4,7 L5,7 L5,8 L4,8 L4,7 Z M0,7 L1,7 L1,8 L0,8 L0,7 Z" id="Combined-Shape" transform="translate(2.500000, 7.500000) scale(-1, -1) rotate(90.000000) translate(-2.500000, -7.500000) "></path>
          </g>
        </svg>
      </button>
    </li>
    <li class="CDB-Shape">
      <button class="CDB-Shape-threePoints is-blue is-small js-toggle-menu">
        <div class="CDB-Shape-threePointsItem"></div>
        <div class="CDB-Shape-threePointsItem"></div>
        <div class="CDB-Shape-threePointsItem"></div>
      </button>
    </li>
  </ul>

</div>
