<div class="Editor-HeaderInfoEditor">
  <div class="u-rSpace--xl u-actionTextColor js-back Editor-HeaderInfoEditorShape">
    <button>
      <i class="CDB-IconFont CDB-IconFont-arrowPrev Size-large"></i>
    </button>
  </div>

  <div class="Editor-HeaderInfo-inner">
    <div class="Editor-HeaderInfo-title u-bSpace js-header">
      <span class="SelectorLayer-letter CDB-Text CDB-Size-small u-whiteTextColor u-tSpace--m u-rSpace--m u-upperCase" style="background-color: <%- bgColor %>;">
        <%- letter %>
      </span>
    </div>
    <div class="u-flex">
      <% if (isTableSource) { %>
        <div class="CDB-Shape CDB-Size-medium u-rSpace">
          <ul class="CDB-Shape-Dataset is-small is-grey">
            <li class="CDB-Shape-DatasetItem"></li>
            <li class="CDB-Shape-DatasetItem"></li>
          </ul>
        </div>
        <p class="Editor-headerLayerName CDB-Text CDB-Size-medium u-ellipsis">
          <a href="<%- url %>" target="_blank" title="<%- tableName %>" class="Editor-headerLayerName"><%- tableName %></a>
        </p>
      <% } %>
    </div>
  </div>

  <div class="Editor-HeaderInfo-zoom CDB-Shape js-zoom">
    <svg width="16px" height="15px" viewBox="287 30 16 15" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <g id="Icon" stroke="none" stroke-width="1" fill="#1785FB" fill-rule="evenodd" transform="translate(288.000000, 30.000000)">
        <circle id="Oval" cx="7.5" cy="7.5" r="0.5"></circle>
        <path d="M7,0 L8,0 L8,5 L7,5 L7,0 Z M6,3 L7,3 L7,4 L6,4 L6,3 Z M8,3 L9,3 L9,4 L8,4 L8,3 Z M9,2 L10,2 L10,3 L9,3 L9,2 Z M5,2 L6,2 L6,3 L5,3 L5,2 Z" id="Combined-Shape"></path>
        <path d="M7,10 L8,10 L8,15 L7,15 L7,10 Z M6,13 L7,13 L7,14 L6,14 L6,13 Z M8,13 L9,13 L9,14 L8,14 L8,13 Z M9,12 L10,12 L10,13 L9,13 L9,12 Z M5,12 L6,12 L6,13 L5,13 L5,12 Z" id="Combined-Shape" transform="translate(7.500000, 12.500000) scale(1, -1) translate(-7.500000, -12.500000) "></path>
        <path d="M12,5 L13,5 L13,10 L12,10 L12,5 Z M11,8 L12,8 L12,9 L11,9 L11,8 Z M13,8 L14,8 L14,9 L13,9 L13,8 Z M14,7 L15,7 L15,8 L14,8 L14,7 Z M10,7 L11,7 L11,8 L10,8 L10,7 Z" id="Combined-Shape" transform="translate(12.500000, 7.500000) scale(1, -1) rotate(90.000000) translate(-12.500000, -7.500000) "></path>
        <path d="M2,5 L3,5 L3,10 L2,10 L2,5 Z M1,8 L2,8 L2,9 L1,9 L1,8 Z M3,8 L4,8 L4,9 L3,9 L3,8 Z M4,7 L5,7 L5,8 L4,8 L4,7 Z M0,7 L1,7 L1,8 L0,8 L0,7 Z" id="Combined-Shape" transform="translate(2.500000, 7.500000) scale(-1, -1) rotate(90.000000) translate(-2.500000, -7.500000) "></path>
      </g>
    </svg>
  </div>

  <div class="CDB-Shape">
    <button class="CDB-Shape-threePoints is-blue is-small js-toggle-menu">
      <div class="CDB-Shape-threePointsItem"></div>
      <div class="CDB-Shape-threePointsItem"></div>
      <div class="CDB-Shape-threePointsItem"></div>
    </button>
  </div>
</div>
