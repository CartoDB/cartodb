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

  <div class="CDB-Shape">
    <button class="CDB-Shape-threePoints is-blue is-small js-toggle-menu">
      <div class="CDB-Shape-threePointsItem"></div>
      <div class="CDB-Shape-threePointsItem"></div>
      <div class="CDB-Shape-threePointsItem"></div>
    </button>
  </div>
</div>
