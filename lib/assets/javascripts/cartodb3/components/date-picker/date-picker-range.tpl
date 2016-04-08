<button class="DatePicker-dates js-dates has-icon">
  From <strong><%- fromDate %> <%- pad(fromHour,2) %>:<%- pad(fromMin,2) %></strong> to <strong><%- toDate %> <%- pad(toHour,2) %>:<%- pad(toMin,2) %></strong>
  <i class="CDB-IconFont CDB-IconFont-calendar DatePicker-datesIcon"></i>
</button>
<div class="DatePicker-dropdown">
  <div class="DatePicker-calendar"></div>
  <div class="DatePicker-timers js-timers"></div>
  <div class="DatePicker-shortcuts">
    <p class="DatePicker-shortcutsText">
      Get last <button type="button" class="Button--link js-fourHours">4 hours</button>,
      <button type="button" class="Button--link js-oneDay">1 day</button> or
      <button type="button" class="Button--link js-oneWeek">1 week</button>
    </p>
    <p class="DatePicker-shortcutsText">Date will be converted to GMT +0</p>
  </div>
</div>
