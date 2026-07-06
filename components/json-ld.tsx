import type { Thing, WithContext } from "schema-dts";
import type { JSX } from "react";

type JsonLdProps = {
	data: WithContext<Thing>;
};

/**
 * Renders a JSON-LD `<script>` tag for the provided schema.org structured data.
 *
 * The payload is serialized server-side, so this component is safe to render in
 * Server Components without exposing any client runtime.
 */
export function JsonLd({ data }: JsonLdProps): JSX.Element {
	return (
		<script
			type="application/ld+json"
			// JSON.stringify output is trusted, server-generated structured data.
			dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
		/>
	);
}
