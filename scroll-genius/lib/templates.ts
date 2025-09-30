/**
 * Core listener injected as a Custom HTML tag.
 * It computes clean scroll %, fires thresholds once, and pushes to dataLayer:
 * { event: 'scrollGeniusThreshold', scroll_percent: <number> }
 *
 * Placeholders:
 *  {{THRESHOLDS}} -> "25,50,75,100"
 *  {{SELECTORS}}  -> "#footer, .cookie"
 *  {{SPAFIX}}     -> "true" | "false"
 */
export const CORE_LISTENER_HTML = (thresholdsCSV:string, selectorsCSV:string, spaFix:boolean) => `
<script>
(function(){
  var THRESHOLDS = (${JSON.stringify(thresholdsCSV)} || "25,50,75,100")
    .split(",").map(function(x){return parseInt(x,10)}).filter(function(x){return !isNaN(x) && x>=0 && x<=100})
    .sort(function(a,b){return a-b});
  var EXCLUDE = (${JSON.stringify(selectorsCSV)} || "").split(",").map(function(s){return s.trim()}).filter(Boolean);
  var SPAFIX = ${spaFix ? "true" : "false"};
  var fired = {};
  var rafId = null;
  var lastEmit = 0;

  function safeTotalExclusion(){
    if (!EXCLUDE.length) return 0;
    var total = 0;
    for (var i=0;i<EXCLUDE.length;i++){
      try {
        var nodes = document.querySelectorAll(EXCLUDE[i]);
        if (!nodes || !nodes.length) continue;
        for (var j=0;j<nodes.length;j++){
          var el = nodes[j];
          if (el && el.offsetHeight) total += el.offsetHeight;
        }
      } catch(e){ /* silent */ }
    }
    return total;
  }

  function computePercent(){
    var dh = Math.max(
      document.documentElement.scrollHeight, document.body.scrollHeight,
      document.documentElement.offsetHeight, document.body.offsetHeight,
      document.documentElement.clientHeight, document.body.clientHeight
    );
    var viewport = window.innerHeight || document.documentElement.clientHeight || 0;
    var maxScroll = Math.max(1, dh - viewport);
    var y = window.pageYOffset || document.documentElement.scrollTop || 0;
    var percent = Math.min(100, Math.round((y / maxScroll) * 100));
    var ex = safeTotalExclusion();
    if (ex > 0 && dh > viewport) {
      var cleanMax = Math.max(1, (dh - ex) - viewport);
      percent = Math.min(100, Math.round((y / cleanMax) * 100));
    }
    return percent;
  }

  function tick(){
    rafId = null;
    var p = computePercent();
    for (var i=0;i<THRESHOLDS.length;i++){
      var t = THRESHOLDS[i];
      if (p >= t && !fired[t]){
        fired[t] = 1;
        if (window.dataLayer && typeof window.dataLayer.push === "function"){
          window.dataLayer.push({event:"scrollGeniusThreshold", scroll_percent:t});
        }
      }
    }
  }

  function onScroll(){
    if (rafId) return;
    rafId = requestAnimationFrame(tick);
  }

  function init(){
    fired = {};
    if (window.addEventListener){
      window.addEventListener("scroll", onScroll, {passive:true});
      window.addEventListener("resize", onScroll);
    }
    // kick once
    tick();
  }

  // SPA support – reset on history changes
  if (SPAFIX){
    var _pushState = history.pushState;
    var _replaceState = history.replaceState;
    function onNav(){ fired = {}; setTimeout(tick, 60); }
    history.pushState = function(){ _pushState.apply(this, arguments); onNav(); };
    history.replaceState = function(){ _replaceState.apply(this, arguments); onNav(); };
    window.addEventListener("popstate", onNav);
    window.addEventListener("hashchange", onNav);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else { init(); }
})();
</script>
`;

export const AJAX_LISTENER_HTML = `
<script>
(function(){
  function push(url){
    if (window.dataLayer) window.dataLayer.push({ event: "scrollGeniusFormSuccess", formUrl: url || "" });
  }
  if (window.XMLHttpRequest){
    var send = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.send = function(){
      this.addEventListener('loadend', function(){
        if (this.readyState === 4 && this.status >= 200 && this.status < 300){ push(this.responseURL || "XHR"); }
      });
      return send.apply(this, arguments);
    };
  }
  if (window.fetch){
    var _fetch = window.fetch;
    window.fetch = function(){
      var p = _fetch.apply(this, arguments);
      p.then(function(r){ if (r && r.ok) push(r.url || "fetch"); });
      return p;
    }
  }
})();
</script>
`;
