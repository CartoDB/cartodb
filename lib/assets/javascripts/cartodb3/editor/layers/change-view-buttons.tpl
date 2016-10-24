<ul class="u-flex u-alignCenter Editor-contextSwitcher js-mapTableView
  <% if (isThereOtherWidgets) { %>is-moved<% } %>
  <% if (isThereTimeSeries) { %>has-timeSeries<% } %>
  ">
  <li class="Editor-contextSwitcherItem">
    <div class="Editor-contextSwitcherButton js-showTable">
      <svg width="11px" height="10px" viewBox="505 436 11 10" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <g id="Group" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd" transform="translate(505.000000, 436.000000)">
          <path d="M3,0 L3,10 L0,10 L0,0 L3,0 Z M1,1 L1,9 L2,9 L2,1 L1,1 Z" id="Combined-Shape" class="Editor-contextSwitcherMedia" ></path>
          <path d="M7,0 L7,10 L4,10 L4,0 L7,0 Z M5,1 L5,9 L6,9 L6,1 L5,1 Z" id="Combined-Shape-Copy" class="Editor-contextSwitcherMedia" ></path>
          <path d="M11,0 L11,10 L8,10 L8,0 L11,0 Z M9,1 L9,9 L10,9 L10,1 L9,1 Z" id="Combined-Shape-Copy-2" class="Editor-contextSwitcherMedia" ></path>
        </g>
      </svg>
    </div>
  </li>
  <li class="Editor-contextSwitcherItem">
    <div class="Editor-contextSwitcherButton js-showMap is-selected">
      <svg width="9px" height="12px" viewBox="538 435 9 12" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
        <path d="M547,438.913043 C547,441.07513 542.5,447 542.5,447 C542.5,447 538,441.07513 538,438.913043 C538,436.752 540.0142,435 542.5,435 C544.9852,435 547,436.752 547,438.913043 Z M543.908614,443.22687 C544.16716,442.824347 544.408524,442.43401 544.629457,442.059548 C545.498835,440.586034 546,439.426635 546,438.913043 C546,437.337768 544.461567,436 542.5,436 C540.538058,436 539,437.337565 539,438.913043 C539,439.426635 539.501165,440.586034 540.370543,442.059548 C540.591476,442.43401 540.83284,442.824347 541.091386,443.22687 C541.539951,443.925227 542.019537,444.628807 542.501367,445.306148 C542.537557,445.357022 543.426358,443.97768 543.908614,443.22687 Z" id="Combined-Shape" stroke="none" class="Editor-contextSwitcherMedia" fill-rule="evenodd"></path>
      </svg>
    </div>
  </li>
</ul>

<% if (isSourceType) { %>
  <ul class="u-flex u-alignRight Editor-contextSwitcher Editor-contextSwitcher--geom js-mapTableView js-newGeometryView">
    <li class="Editor-contextSwitcherItem">
      <div class="Editor-contextSwitcherButton Editor-contextSwitcherButton--geom js-newGeometry <% if (queryGeometryModel !== 'point') { %>is-hidden<% } %>" data-feature-type='point'>
        <svg width="9px" height="12px" viewBox="538 435 9 12" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
          <path d="M547,438.913043 C547,441.07513 542.5,447 542.5,447 C542.5,447 538,441.07513 538,438.913043 C538,436.752 540.0142,435 542.5,435 C544.9852,435 547,436.752 547,438.913043 Z M543.908614,443.22687 C544.16716,442.824347 544.408524,442.43401 544.629457,442.059548 C545.498835,440.586034 546,439.426635 546,438.913043 C546,437.337768 544.461567,436 542.5,436 C540.538058,436 539,437.337565 539,438.913043 C539,439.426635 539.501165,440.586034 540.370543,442.059548 C540.591476,442.43401 540.83284,442.824347 541.091386,443.22687 C541.539951,443.925227 542.019537,444.628807 542.501367,445.306148 C542.537557,445.357022 543.426358,443.97768 543.908614,443.22687 Z" id="Combined-Shape" stroke="none" class="Editor-contextSwitcherMedia" fill-rule="evenodd"></path>
        </svg>
      </div>
      <div class="Editor-contextSwitcherButton Editor-contextSwitcherButton--geom js-newGeometry <% if (queryGeometryModel !== 'line') { %>is-hidden<% } %>" data-feature-type='line'>
        <svg width="9px" height="12px" viewBox="538 435 9 12" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
          <path d="M547,438.913043 C547,441.07513 542.5,447 542.5,447 C542.5,447 538,441.07513 538,438.913043 C538,436.752 540.0142,435 542.5,435 C544.9852,435 547,436.752 547,438.913043 Z M543.908614,443.22687 C544.16716,442.824347 544.408524,442.43401 544.629457,442.059548 C545.498835,440.586034 546,439.426635 546,438.913043 C546,437.337768 544.461567,436 542.5,436 C540.538058,436 539,437.337565 539,438.913043 C539,439.426635 539.501165,440.586034 540.370543,442.059548 C540.591476,442.43401 540.83284,442.824347 541.091386,443.22687 C541.539951,443.925227 542.019537,444.628807 542.501367,445.306148 C542.537557,445.357022 543.426358,443.97768 543.908614,443.22687 Z" id="Combined-Shape" stroke="none" class="Editor-contextSwitcherMedia" fill-rule="evenodd"></path>
        </svg>
      </div>
      <div class="Editor-contextSwitcherButton Editor-contextSwitcherButton--geom js-newGeometry <% if (queryGeometryModel !== 'polygon') { %>is-hidden<% } %>" data-feature-type='polygon'>
        <svg width="9px" height="12px" viewBox="538 435 9 12" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
          <path d="M547,438.913043 C547,441.07513 542.5,447 542.5,447 C542.5,447 538,441.07513 538,438.913043 C538,436.752 540.0142,435 542.5,435 C544.9852,435 547,436.752 547,438.913043 Z M543.908614,443.22687 C544.16716,442.824347 544.408524,442.43401 544.629457,442.059548 C545.498835,440.586034 546,439.426635 546,438.913043 C546,437.337768 544.461567,436 542.5,436 C540.538058,436 539,437.337565 539,438.913043 C539,439.426635 539.501165,440.586034 540.370543,442.059548 C540.591476,442.43401 540.83284,442.824347 541.091386,443.22687 C541.539951,443.925227 542.019537,444.628807 542.501367,445.306148 C542.537557,445.357022 543.426358,443.97768 543.908614,443.22687 Z" id="Combined-Shape" stroke="none" class="Editor-contextSwitcherMedia" fill-rule="evenodd"></path>
        </svg>
      </div>
    </li>
  </ul>
<% } %>
