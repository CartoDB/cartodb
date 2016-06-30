<div class="Editor-HeaderInfo-inner">
  <div class="Editor-HeaderInfo-title u-bSpace--m js-name">
    <div class="js-name">
      <h2 class="Editor-HeaderInfo-titleText u-ellipsis CDB-Text CDB-Size-huge is-light"><%- title %></h2>
    </div>
    <button class="CDB-Shape u-lSpace js-quantification">
      <div class="CDB-Shape-threePoints is-blue is-small">
        <div class="CDB-Shape-threePointsItem"></div>
        <div class="CDB-Shape-threePointsItem"></div>
        <div class="CDB-Shape-threePointsItem"></div>
      </div>
    </button>
  </div>
  <div class="u-bSpace--xl">
    <button class="u-rSpace--xl u-actionTextColor js-privacy">
      <i class="Tag Tag--outline <%- cssClass %> CDB-Text CDB-Size-small u-upperCase"><%- privacy %></i>
    </button>
    <span class="CDB-Text CDB-Size-medium u-altTextColor"><%- _t('dataset.updated', { ago: ago }) %></span>
  </div>
</div>
