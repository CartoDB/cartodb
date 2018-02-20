<li class="Editor-newLayerContainer" data-layer-letter="<%- layerLetter %>" data-analysis-node-id="<%- nodeId %>" style="width: 294px;">
  <div class="Editor-ListLayer-item">
    <div class="Editor-ListLayer-itemHeader">
      <div class="Editor-ListLayer-media u-rSpace--m" style="background: <%- nextBgColor %>; color: #fff">
        <p class="CDB-Text CDB-Size-large is-semibold u-upperCase"><%- nextLetter %></p>
      </div>
      <div class="Editor-ListLayer-inner">
        <div class="Editor-ListLayer-title">
          <h2 class="Editor-ListLayer-titleText CDB-Text CDB-Size-large u-ellipsis"><%- title %></h2>
        </div>
        <button class="CDB-Text CDB-Size-small u-actionTextColor u-upperCase"><%- _t('editor.layers.layer.add-analysis') %></button>
      </div>
    </div>
  </div>
  <div class="Editor-layerInfo CDB-Text CDB-Size-small u-whiteTextColor">
    Created new layer based on [<%- nodeId %>]
  </div>
</li>
