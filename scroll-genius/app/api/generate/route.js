import { NextResponse } from "next/server";
import { buildContainer } from "../../../lib/gtm";

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      ga4MeasurementId,
      eventName,
      thresholds,
      selectors,
      spaFix,
      ajaxForms,
      premium
    } = body ?? {};

    if (!ga4MeasurementId || !eventName) {
      return NextResponse.json({ error: "Missing GA4 ID or event name" }, { status: 400 });
    }

    const json = buildContainer({
      ga4Id: String(ga4MeasurementId),
      eventName: String(eventName),
      thresholds: String(thresholds || "25,50,75,100"),
      selectors: String(selectors || ""),
      spaFix: Boolean(spaFix),
      ajaxForms: Boolean(ajaxForms),
      premium: Boolean(premium)
    });

    return NextResponse.json(json);
  } catch (e) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
