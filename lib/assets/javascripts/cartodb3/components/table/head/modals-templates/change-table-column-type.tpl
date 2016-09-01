<div class="u-flex u-justifyCenter">
  <div class="Modal-inner u-flex u-justifyCenter">
    <div class="Modal-icon">
      <svg width="24px" height="24px" viewBox="0 5 24 24" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <defs>
          <path d="M9.0155676,21 L0.947783801,21 C0.424337262,21 0,20.580517 0,20.0431048 L0,0.956895232 L0,0.956895232 C0,0.428416588 0.427961349,0 0.941139013,0 L15.058861,0 C15.5786377,0 16,0.436558338 16,0.962503259 L16,12.2661378" id="path-1"></path>
          <mask id="mask-2" maskContentUnits="userSpaceOnUse" maskUnits="objectBoundingBox" x="0" y="0" width="16" height="21" fill="white">
              <use xlink:href="#path-1"></use>
          </mask>
        </defs>
        <g id="file-edit-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" transform="translate(0.000000, 5.000000)">
          <g id="Outline_Icons">
            <use id="Rectangle" stroke="#FEB100" mask="url(#mask-2)" stroke-width="2" xlink:href="#path-1"></use>
            <rect id="Rectangle-2" fill="#FEB100" x="0" y="4" width="15" height="1"></rect>
            <path d="M22.854,13.646 L20.354,11.146 C20.166,10.958 19.834,10.958 19.647,11.146 L12.146,18.648 C12.089,18.705 12.054,18.773 12.03,18.845 C12.028,18.852 12.021,18.857 12.019,18.865 L11.019,22.365 C10.969,22.539 11.018,22.727 11.146,22.856 C11.241,22.951 11.369,23.002 11.5,23.002 C11.546,23.002 11.592,22.996 11.637,22.983 L15.137,21.983 C15.144,21.981 15.149,21.974 15.157,21.972 C15.229,21.948 15.297,21.913 15.354,21.856 L22.855,14.354 C23.05,14.158 23.05,13.842 22.854,13.646 L22.854,13.646 Z M15,20.795 L13.207,19.002 L18.001,14.207 L19.794,16 L15,20.795 L15,20.795 Z M12.747,19.957 L14.045,21.255 L12.228,21.775 L12.747,19.957 L12.747,19.957 Z M20.501,15.293 L18.708,13.5 L20.001,12.207 L21.794,14 L20.501,15.293 L20.501,15.293 Z" id="Shape" fill="#FEB100"></path>
          </g>
        </g>
      </svg>
    </div>
    <div>
      <h2 class=" CDB-Text CDB-Size-huge is-light u-bSpace--m u-alertTextColor">
        <%- _t('components.table.columns.change-type.title', { columnName: columnName, newType: newType }) %>
      </h2>
      <p class="CDB-Text CDB-Size-medium u-altTextColor">
        <%- _t('components.table.columns.change-type.desc') %>
      </p>
      <ul class="Modal-listActions u-flex u-alignCenter">
        <li class="Modal-listActionsitem">
          <button class="CDB-Button CDB-Button--secondary CDB-Button--big js-cancel">
            <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium u-upperCase">
              <%- _t('components.table.columns.change-type.cancel') %>
            </span>
          </button>
        </li>
        <li class="Modal-listActionsitem">
          <button class="CDB-Button CDB-Button--primary CDB-Button--big js-confirm">
            <span class="CDB-Button-Text CDB-Text is-semibold CDB-Size-medium u-upperCase">
              <%- _t('components.table.columns.change-type.confirm') %>
            </span>
          </button>
        </li>
      </ul>
    </div>
  </div>
</div>
