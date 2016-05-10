<div class="CDB-Box-modalHeaderItem">
  <button class="u-rSpace--xl u-actionTextColor js-back">
    <i class="CDB-IconFont CDB-IconFont-arrowPrev Size-large"></i>
  </button>
  <%- attribute %>
</div>
<div class="CDB-Box-modalHeaderItem">
  <%- bins %> <%- _t('form-components.editors.fill.input-ramp.buckets', { smart_count: bins }) %>
  <button class="CDB-Shape u-lSpace js-bins">
    <div class="CDB-Shape-threePoints is-horizontal is-blue is-small">
      <div class="CDB-Shape-threePointsItem"></div>
      <div class="CDB-Shape-threePointsItem"></div>
      <div class="CDB-Shape-threePointsItem"></div>
    </div>
  </button>

  <%- quantification %>
  <button class="CDB-Shape u-lSpace js-quantification">
    <div class="CDB-Shape-threePoints is-horizontal is-blue is-small">
      <div class="CDB-Shape-threePointsItem"></div>
      <div class="CDB-Shape-threePointsItem"></div>
      <div class="CDB-Shape-threePointsItem"></div>
    </div>
  </button>
</div>
<div class="js-content"></div>
