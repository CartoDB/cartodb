<div class="Editor-HeaderInfoEditor">
  <button class="u-rSpace--xl u-actionTextColor js-back">
    <i class="CDB-IconFont CDB-IconFont-arrowPrev Size-large"></i>
  </button>

  <div class="Editor-HeaderInfo-inner">
    <div class="Editor-HeaderInfo-title u-bSpace js-header">
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

  <div class=" CDB-Shape">
    <button class="CDB-Shape-threePoints is-blue is-small js-toggle-menu">
      <div class="CDB-Shape-threePointsItem"></div>
      <div class="CDB-Shape-threePointsItem"></div>
      <div class="CDB-Shape-threePointsItem"></div>
    </button>
  </div>
</div>
