<div class="CDB-HeaderInfo">
  <div class="CDB-HeaderNumeration CDB-Text is-semibold u-rSpace--m">1</div>
  <div class="CDB-HeaderInfo-Inner CDB-Text">
    <div class="CDB-HeaderInfo-Title u-bSpace--s">
      <h2 class="CDB-Text CDB-HeaderInfo-TitleText CDB-Size-large"><%- _t('editor.layers.analysis-form.workflow') %></h2>
    </div>
    <p class="CDB-Text u-upperCase CDB-FontSize-small u-altTextColor u-bSpace--m">
      <%- _t('editor.layers.layer.analysis') %> <%- selectedNodeId %>
      <button class="js-delete u-actionTextColor u-upperCase"><%- _t('editor.layers.layer.delete') %></button>
    </p>
    <ul class="js-list HorizontalBlockList">
      <li class="HorizontalBlockList-item is-add">
        <button class="js-add-analysis">
          <div class="CDB-Shape">
            <div class="CDB-Shape-add is-blue is-small"></div>
          </div>
        </button>
      </li>
    </ul>
  </div>
</div>
