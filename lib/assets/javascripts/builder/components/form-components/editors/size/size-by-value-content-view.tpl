<div class="CDB-Box-modalHeader">
  <ul class="CDB-Box-modalHeaderItem CDB-Box-modalHeaderItem--block CDB-Box-modalHeaderItem--paddingHorizontal">
    <li class="InputColor-modalHeader CDB-ListDecoration-item CDB-ListDecoration-itemPadding--vertical CDB-Text CDB-Size-medium u-secondaryTextColor">
      <div class="u-flex u-alignStart u-ellipsis">
        <button class="u-rSpace u-actionTextColor js-back">
          <i class="CDB-IconFont CDB-IconFont-arrowPrev Size-large"></i>
        </button>
        <div class="u-ellipsis test-attribute">
          <%- attribute %>
        </div>
      </div>
    </li>
    <li class="CDB-ListDecoration-item CDB-ListDecoration-itemPadding--vertical CDB-Text CDB-Size-medium u-secondaryTextColor">
      <ul class="u-flex u-justifySpace">
        <li class="u-flex test-bins">
          <%- bins %> <%- _t('form-components.editors.fill.input-ramp.buckets', { smart_count: bins }) %>
          <button class="CDB-Shape u-lSpace js-bins">
            <div class="CDB-Shape-threePoints is-horizontal is-blue is-small">
              <div class="CDB-Shape-threePointsItem"></div>
              <div class="CDB-Shape-threePointsItem"></div>
              <div class="CDB-Shape-threePointsItem"></div>
            </div>
          </button>
        </li>
        <li class="u-flex test-quantification">
          <%- _t('form-components.editors.fill.quantification.methods.' + quantification) %>
          <button class="CDB-Shape u-lSpace js-quantification">
            <div class="CDB-Shape-threePoints is-horizontal is-blue is-small">
              <div class="CDB-Shape-threePointsItem"></div>
              <div class="CDB-Shape-threePointsItem"></div>
              <div class="CDB-Shape-threePointsItem"></div>
            </div>
          </button>
        </li>
      </ul>
    </li>
  </ul>
</div>
<div class="js-content"></div>
