<div class="ModalBlockList-itemInput">
  <input class="CDB-Checkbox js-checkbox" type="checkbox" <% if (isSelected) { %>checked="checked"<% } %> />
  <span class="u-iBlock CDB-Checkbox-face"></span>
</div>

<div class="ModalBlockList-item-text js-inner">
  <h3 class="CDB-Text CDB-Size-large u-bSpace--xl"><%- columnName %></h3>
  <div class="u-bSpace--xl">
    <svg width="239px" height="16px" viewBox="0 0 239 16" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" sketch:type="MSPage">
        <g id="Bars" sketch:type="MSLayerGroup">
          <g id="Group" fill="#EEEEEE" sketch:type="MSShapeGroup">
            <rect id="vLine" x="71" y="0" width="1" height="16"></rect>
            <rect id="vLine" x="132" y="0" width="1" height="16"></rect>
            <rect id="vLine" x="193" y="0" width="1" height="16"></rect>
            <rect id="hLine" x="0" y="0" width="239" height="1"></rect>
            <rect id="hLine" x="0" y="8" width="239" height="1"></rect>
          </g>
          <% var HEIGHT = 16; %>
          <% for (var i = 0; i < 9; i++) {
            var MAX_VAL = 12;
            var MIN_VAL = 1;
            var y = Math.floor(Math.random() * MAX_VAL + MIN_VAL) %>
            <rect id="Bar-Copy-7" fill="#9DE0AD" sketch:type="MSShapeGroup" x="<%- 29 * i %>" y="<%- y %>" width="27" height="<%- HEIGHT - y %>"></rect>
          <% } %>
          <rect id="xAxis" fill="#AAAAAA" sketch:type="MSShapeGroup" x="0" y="15" width="239" height="1"></rect>
        </g>
      </g>
    </svg>
  </div>
</div>
