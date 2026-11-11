/**
 * Load third-party scripts after first paint so they stay off the critical path.
 * IDs are read from <html data-*> attributes set by MainLayout.
 */
(function () {
  function loadScript(src) {
    var s = document.createElement('script');
    s.async = true;
    s.src = src;
    document.head.appendChild(s);
  }

  function loadStylesheet(href) {
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = href;
    document.head.appendChild(l);
  }

  function run() {
    var root = document.documentElement;
    var gaId = root.getAttribute('data-ga-id');
    var gtmId = root.getAttribute('data-gtm-id');
    var fbPixelId = root.getAttribute('data-fb-pixel-id');

    if (gtmId && !window.__e5GtmLoaded) {
      window.__e5GtmLoaded = true;
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
      loadScript('https://www.googletagmanager.com/gtm.js?id=' + gtmId);
    }

    if (gaId && !window.__e5GaLoaded) {
      window.__e5GaLoaded = true;
      loadScript('https://www.googletagmanager.com/gtag/js?id=' + gaId);
    }

    if (fbPixelId && !window.__e5FbLoaded) {
      window.__e5FbLoaded = true;
      !function (f, b, e, v, n, t, s) {
        if (f.fbq) return;
        n = f.fbq = function () {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = !0;
        n.version = '2.0';
        n.queue = [];
        t = b.createElement(e);
        t.async = !0;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
      }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      window.fbq('init', fbPixelId);
      window.fbq('track', 'PageView');
    }

    if (!window.__e5FontsLoaded) {
      window.__e5FontsLoaded = true;
      loadStylesheet('https://fonts.googleapis.com/css2?family=Libre+Franklin:wght@400;500;600;700;800;900&family=Work+Sans:wght@400;500;600;700;800;900&display=swap');
    }
  }

  if ('requestIdleCallback' in window) {
    requestIdleCallback(run, { timeout: 3000 });
  } else if (document.readyState === 'complete') {
    run();
  } else {
    window.addEventListener('load', run);
  }
})();
