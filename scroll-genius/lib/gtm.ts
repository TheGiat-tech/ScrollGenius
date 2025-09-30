import { CORE_LISTENER_HTML, AJAX_LISTENER_HTML } from "./templates";

/** A tiny ID generator for GTM objects (stable per run) */
const idBase = Date.now().toString().slice(-6);
const mkId = (n:number) => String(Number(idBase) + n);

/** Build a minimal-yet-valid GTM container JSON (exportFormatVersion:2) */
export function buildContainer(opts: {
  ga4Id: string;
  eventName: string;
  thresholds: string;
  selectors: string;
  spaFix: boolean;
  ajaxForms: boolean;
  premium: boolean;
}) {
  const TR_INIT = mkId(1);        // DOM Ready trigger for core HTML
  const TR_CEVT = mkId(2);        // Custom event trigger (scroll thresholds)
  const TR_FORM = mkId(3);        // Custom event trigger (form success)

  const VAR_SCROLL_PERCENT = mkId(11); // DL var id
  const VAR_FORM_URL       = mkId(12);

  const T_HTML_CORE = mkId(21);
  const T_GA4       = mkId(22);
  const T_HTML_FORM = mkId(23);

  const exportFormatVersion = 2;

  // ---- TRIGGERS ----
  const triggers:any[] = [
    {
      "triggerId": TR_INIT,
      "name": "ScrollGenius – Init (DOM Ready)",
      "type": "DOM_READY",
      "filter": []
    },
    {
      "triggerId": TR_CEVT,
      "name": "ScrollGenius – Threshold Event",
      "type": "CUSTOM_EVENT",
      "parameter": [
        { "type": "template", "key": "eventName", "value": "scrollGeniusThreshold" },
        { "type": "boolean", "key": "useRegex", "value": "false" }
      ]
    }
  ];

  if (opts.ajaxForms && opts.premium) {
    triggers.push({
      "triggerId": TR_FORM,
      "name": "FormGenius – AJAX Success",
      "type": "CUSTOM_EVENT",
      "parameter": [
        { "type": "template", "key": "eventName", "value": "scrollGeniusFormSuccess" },
        { "type": "boolean", "key": "useRegex", "value": "false" }
      ]
    });
  }

  // ---- VARIABLES ----
  const variables:any[] = [
    {
      "variableId": VAR_SCROLL_PERCENT,
      "name": "DL – scroll_percent",
      "type": "v",
      "parameter": [
        { "type": "integer", "key": "dataLayerVersion", "value": "2" },
        { "type": "template", "key": "name", "value": "scroll_percent" }
      ]
    }
  ];
  if (opts.ajaxForms && opts.premium) {
    variables.push({
      "variableId": VAR_FORM_URL,
      "name": "DL – formUrl",
      "type": "v",
      "parameter": [
        { "type": "integer", "key": "dataLayerVersion", "value": "2" },
        { "type": "template", "key": "name", "value": "formUrl" }
      ]
    });
  }

  // ---- TAGS ----
  const tags:any[] = [
    // 1) Core Custom HTML listener (fires once on DOM_READY)
    {
      "tagId": T_HTML_CORE,
      "name": "ScrollGenius – Core Listener",
      "type": "html",
      "parameter": [
        { "type": "template", "key": "html", "value": CORE_LISTENER_HTML(opts.thresholds, opts.selectors, opts.spaFix).replace(/\n/g, " ") },
        { "type": "boolean", "key": "supportDocumentWrite", "value": "false" }
      ],
      "firingTriggerId": [ TR_INIT ]
    },

    // 2) GA4 Event fired by threshold custom event
    {
      "tagId": T_GA4,
      "name": `GA4 Event – ${opts.eventName} (ScrollGenius)`,
      "type": "gaawe",
      "parameter": [
        { "type": "template", "key": "measurementId", "value": opts.ga4Id },
        { "type": "template", "key": "eventName", "value": opts.eventName },
        {
          "type": "list", "key": "eventParameters",
          "list": [
            { "type":"map", "map":[
              { "type":"template", "key":"name", "value":"percent_scrolled" },
              { "type":"template", "key":"value", "value":"{{DL – scroll_percent}}" }
            ]}
          ]
        }
      ],
      "firingTriggerId": [ TR_CEVT ]
    }
  ];

  if (opts.ajaxForms && opts.premium) {
    tags.push({
      "tagId": T_HTML_FORM,
      "name": "FormGenius – AJAX Listener (Custom HTML)",
      "type": "html",
      "parameter": [
        { "type":"template", "key":"html", "value": AJAX_LISTENER_HTML.replace(/\n/g," ") },
        { "type":"boolean", "key":"supportDocumentWrite", "value":"false" }
      ],
      "firingTriggerId": [ TR_INIT ]
    });
  }

  // ---- CONTAINER WRAP ----
  const container:any = {
    "exportFormatVersion": exportFormatVersion,
    "containerVersion": {
      "tag": tags,
      "trigger": triggers,
      "variable": variables,
      "builtInVariable": [
        { "type": "PAGE_URL" },
        { "type": "PAGE_HOSTNAME" },
        { "type": "PAGE_PATH" }
      ]
    }
  };

  // Free mode guard: when not premium, always strip selectors and force default thresholds inside the HTML tag.
  if (!opts.premium) {
    const htmlTag = container.containerVersion.tag.find((t:any)=>t.tagId===T_HTML_CORE);
    if (htmlTag) {
      htmlTag.parameter[0].value = CORE_LISTENER_HTML("25,50,75,100", "", opts.spaFix).replace(/\n/g," ");
    }
  }

  return container;
}
