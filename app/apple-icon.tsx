import { ImageResponse } from "next/og";

import { siteConfig } from "@/lib/site-config";

export const size = {
	width: 180,
	height: 180,
};
export const contentType = "image/png";

export default function AppleIcon(): ImageResponse {
	return new ImageResponse(
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				fontSize: 110,
				fontWeight: 700,
				color: siteConfig.backgroundColor,
				background: siteConfig.themeColor,
			}}
		>
			{siteConfig.name.charAt(0)}
		</div>,
		{
			...size,
		},
	);
}
