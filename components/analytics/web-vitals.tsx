"use client";

import type { JSX } from "react";
import { useReportWebVitals } from "next/web-vitals";

import { trackEvent } from "@/lib/analytics";

type ReportWebVitalsCallback = Parameters<typeof useReportWebVitals>[0];

const reportWebVitals: ReportWebVitalsCallback = (metric) => {
	trackEvent(metric.name, {
		value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value),
		metric_id: metric.id,
		metric_label: metric.label,
		non_interaction: true,
	});
};

export function WebVitals(): JSX.Element | null {
	useReportWebVitals(reportWebVitals);
	return null;
}
