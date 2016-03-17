<div class="Editor-ListLayer-itemHeader">
  <div class="Editor-ListLayer-media u-rSpace--m" style="background: #E27D61; color: #fff">
    <p class="CDB-Text CDB-Size-large is-semibold"><%- letter %></p>
  </div>
  <div class="Editor-ListLayer-Inner">
    <div class="Editor-ListLayer-Title">
      <h2 class="Editor-ListLayer-TitleText CDB-Text CDB-Size-large u-ellipsis"><%- title %></h2>
      <ul class="Editor-HeaderInfo-Actions">
        <li class="Editor-HeaderInfo-ActionsItem CDB-Shape">
          <div class="CDB-ArrowToogle is-blue is-small"></div>
        </li>
        <li class="Editor-HeaderInfo-ActionsItem CDB-Shape">
          <button class="CDB-Shape-threePoints is-blue is-small">
            <div class="CDB-Shape-threePointsItem"></div>
            <div class="CDB-Shape-threePointsItem"></div>
            <div class="CDB-Shape-threePointsItem"></div>
          </button>
        </li>
      </ul>
    </div>
    <button class="CDB-Text CDB-Size-small u-actionTextColor u-upperCase">
      <%- _t('editor.layers.layer.add-analysis') %>
    </button>
  </div>
</div>
<ul class="Editor-ListAnalysis js-analyses"></ul>
