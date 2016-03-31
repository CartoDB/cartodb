<form>
  <div class="CDB-HeaderInfo">
    <div class="CDB-HeaderNumeration CDB-Text is-semibold u-rSpace--m">2</div>
    <div class="CDB-HeaderInfo-Inner CDB-Text">
      <div class="CDB-HeaderInfo-Title u-bSpace--s">
        <h2 class="CDB-Text CDB-HeaderInfo-TitleText CDB-Size-large"><%- _t('editor.layers.analysis-form.point-in-polygon') %></h2>
      </div>
      <p class="CDB-Text u-upperCase CDB-FontSize-small u-altTextColor u-bSpace--m"><%- _t('editor.layers.analysis-form.reference-layer') %></p>
      <div class="u-tSpace-xl CDB-Text">
        <p class="CDB-Legend u-upperCase u-iBlock CDB-Text is-semibold CDB-Size-small u-rSpace--m"><%- _t('editor.layers.analysis-form.input') %></p>
        <div class="CDB-Text CDB-Size-medium u-iBlock" data-editors="source_id"></div>
      </div>
    </div>
  </div>
  <div class="CDB-HeaderInfo">
    <div class="CDB-HeaderNumeration CDB-Text is-semibold u-rSpace--m">3</div>
    <div class="CDB-HeaderInfo-Inner CDB-Text">
      <div class="CDB-HeaderInfo-Title u-bSpace--s">
        <h2 class="CDB-Text CDB-HeaderInfo-TitleText CDB-Size-large"><%- _t('editor.layers.analysis-form.parameters') %></h2>
      </div>
      <p class="CDB-Text u-upperCase CDB-FontSize-small u-altTextColor u-bSpace--m"><%- _t('editor.layers.analysis-form.parameters-description') %></p>
      <div class="u-tSpace-xl CDB-Text">
        <p class="CDB-Legend u-upperCase u-iBlock CDB-Text is-semibold CDB-Size-small u-rSpace--m"><%- _t('editor.layers.analysis-form.points_source') %></p>
        <div class="CDB-Text CDB-Size-medium u-iBlock" data-editors="points_source"></div>
      </div>
      <div class="u-tSpace-xl CDB-Text">
        <p class="CDB-Legend u-upperCase u-iBlock CDB-Text is-semibold CDB-Size-small u-rSpace--m"><%- _t('editor.layers.analysis-form.polygons_source') %></p>
        <div class="CDB-Text CDB-Size-medium u-iBlock" data-editors="polygons_source"></div>
      </div>
    </div>
  </div>
</form>
