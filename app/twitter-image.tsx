import { ImageResponse } from "next/og";

import { OgCard } from "@/components/og-card";
import { siteConfig } from "@/lib/site-config";

export const alt = siteConfig.title;
export const size = {
	width: 1200,
	height: 630,
};
export const contentType = "image/png";

export default function TwitterImage(): ImageResponse {
	return new ImageResponse(<OgCard />, {
		...size,
	});
}
