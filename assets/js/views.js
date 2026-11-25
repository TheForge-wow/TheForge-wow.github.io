/* Site-wide view count from GoatCounter, shown in the footer. */
(function () {
  'use strict';
  var el = document.getElementById('views');
  if (!el || !window.fetch) return;
  fetch('https://scryptik.goatcounter.com/counter/TOTAL.json')
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (d) {
      if (!d || !d.count) return;
      el.querySelector('.views-n').textContent = d.count;
      el.hidden = false;
    })
    .catch(function () {});
})();
