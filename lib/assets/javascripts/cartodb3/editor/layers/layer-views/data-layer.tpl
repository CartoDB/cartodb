<div class="Editor-ListLayer-dragIcon">
  <div class="CDB-Shape">
    <div class="CDB-Shape-rectsHandle is-small">
      <div class="CDB-Shape-rectsHandleItem CDB-Shape-rectsHandleItem--grey is-first"></div>
      <div class="CDB-Shape-rectsHandleItem CDB-Shape-rectsHandleItem--grey is-second"></div>
      <div class="CDB-Shape-rectsHandleItem CDB-Shape-rectsHandleItem--grey is-third"></div>
    </div>
  </div>
</div>
<div class="Editor-ListLayer-itemHeader">
  <div class="Editor-ListLayer-media u-rSpace--m js-thumbnail" style="background: <%- color %>; color: #fff">
    <p class="CDB-Text CDB-Size-large is-semibold u-upperCase"><%- letter %></p>
  </div>
  <div class="Editor-ListLayer-inner">
    <div class="Editor-ListLayer-title">
      <div class="Editor-ListLayer-titleText js-header"></div>
      <ul class="Editor-HeaderInfo-actions">
        <li class="Editor-HeaderInfo-actionsItem CDB-Shape">
          <button class="js-toggle">
            <% if (isVisible) { %>
              <i class="CDB-IconFont CDB-IconFont-view u-actionTextColor"></i>
            <% } else { %>
              <i class="CDB-IconFont CDB-IconFont-hide u-actionTextColor"></i>
            <% } %>
          </button>
        </li>
        <li class="Editor-HeaderInfo-actionsItem CDB-Shape">
          <button class="CDB-Shape-threePoints is-blue is-small js-toggle-menu">
            <div class="CDB-Shape-threePointsItem"></div>
            <div class="CDB-Shape-threePointsItem"></div>
            <div class="CDB-Shape-threePointsItem"></div>
          </button>
        </li>
      </ul>
    </div>
    <div class="u-flex u-justifySpace">
      <button class="CDB-Text CDB-Size-small u-actionTextColor u-upperCase js-add-analysis" data-layer-id="<%- layerId %>">
        <%- _t('editor.layers.layer.add-analysis') %>
      </button>
      <% if (isCollapsed && numberOfAnalyses > 0) { %>
        <p class="CDB-Text CDB-Size-small u-secondaryTextColor">
          <%- _t('editor.layers.layer.analyses-count', { smart_count: numberOfAnalyses }) %>
        </p>
      <% } %>
    </div>
  </div>
</div>
<ul class="Editor-ListAnalysis js-analyses <%- isCollapsed ? 'is-hidden' : '' %>"></ul>
