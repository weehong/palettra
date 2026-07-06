import { ImageResponse } from "next/og";

import { siteConfig } from "@/lib/site-config";

export const size = {
	width: 32,
	height: 32,
};
export const contentType = "image/png";

export default function Icon(): ImageResponse {
	return new ImageResponse(
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				fontSize: 22,
				fontWeight: 700,
				color: siteConfig.backgroundColor,
				background: siteConfig.themeColor,
				borderRadius: 6,
			}}
		>
			{siteConfig.name.charAt(0)}
		</div>,
		{
			...size,
		},
	);
}
