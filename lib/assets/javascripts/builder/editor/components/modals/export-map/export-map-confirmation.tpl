<div class="u-flex u-justifyCenter">
  <div class="Modal-inner Modal-inner--grid u-flex u-justifyCenter">
    <div class="Modal-icon">
      <svg width="24px" height="24px" viewbox="459 348 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <g id="Export-dataset" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" transform="translate(459.000000, 348.000000)">
          <path d="M1,1 L11,1 L11,5.5 C11,5.776 11.224,6 11.5,6 L16,6 L16,9.5 L17,9.5 L17,5.502 C17,5.502 17,5.502 17,5.501 C17,5.5 17,5.501 17,5.5 C17,5.447 16.985,5.398 16.97,5.35 C16.966,5.337 16.967,5.323 16.962,5.311 C16.936,5.247 16.896,5.19 16.847,5.142 L11.854,0.147 C11.808,0.101 11.753,0.064 11.692,0.039 C11.632,0.014 11.567,0 11.5,0 L0.5,0 C0.224,0 0,0.224 0,0.5 L0,21.5 C0,21.776 0.224,22 0.5,22 L10.5,22 L10.5,21 L1,21 L1,1 L1,1 Z M12,1.708 L15.291,5 L12,5 L12,1.708 L12,1.708 Z" id="Shape" fill="#2E3C43"/>
          <path d="M17.5,11 C13.916,11 11,13.916 11,17.5 C11,21.084 13.916,24 17.5,24 C21.084,24 24,21.084 24,17.5 C24,13.916 21.084,11 17.5,11 L17.5,11 Z M17.5,23 C14.467,23 12,20.533 12,17.5 C12,14.467 14.467,12 17.5,12 C20.533,12 23,14.467 23,17.5 C23,20.533 20.533,23 17.5,23 L17.5,23 Z" id="Shape" fill="#2E3C43"/>
          <path d="M17.858,14.425 C17.767,14.331 17.641,14.272 17.5,14.272 C17.359,14.272 17.232,14.331 17.142,14.425 L14.965,16.602 C14.77,16.797 14.77,17.114 14.965,17.309 C15.16,17.504 15.477,17.504 15.672,17.309 L17,15.981 L17,20.226 C17,20.502 17.224,20.726 17.5,20.726 C17.776,20.726 18,20.502 18,20.226 L18,15.981 L19.328,17.309 C19.426,17.407 19.554,17.455 19.682,17.455 C19.81,17.455 19.938,17.406 20.036,17.309 C20.231,17.114 20.231,16.797 20.036,16.602 L17.858,14.425 L17.858,14.425 Z" id="Shape" fill="#2E3C43" transform="translate(17.500500, 17.499000) scale(1, -1) translate(-17.500500, -17.499000) "/>
        </g>
      </svg>
    </div>
    <div>
      <h2 class=" CDB-Text CDB-Size-huge is-light u-bSpace--xl"><%- _t('editor.maps.export.confirmation.title', { name: name }) %></h2>
      <p class="CDB-Text CDB-Size-large u-altTextColor"><%- _t('editor.maps.export.confirmation.desc') %></p>
      <ul class="Modal-listActions u-flex u-alignCenter">
        <li class="Modal-listActionsitem">
          <button class="CDB-Button CDB-Button--secondary CDB-Button--big js-cancel">
            <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium u-upperCase">
               <%- _t('editor.maps.export.confirmation.cancel') %>
            </span>
          </button>
        </li>
        <li class="Modal-listActionsitem">
          <button class="CDB-Button CDB-Button--primary CDB-Button--big js-confirm">
            <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium u-upperCase">
              <%- _t('editor.maps.export.confirmation.confirm') %>
            </span>
          </button>
        </li>
      </ul>
    </div>
  </div>
</div>
