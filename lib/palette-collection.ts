import type {
	DocumentData,
	Firestore,
	FirestoreDataConverter,
	QueryDocumentSnapshot,
	SnapshotOptions,
	Timestamp,
	WithFieldValue,
} from "firebase/firestore";
import {
	addDoc,
	collection,
	deleteDoc,
	doc,
	getDocs,
	limit,
	orderBy,
	query,
	serverTimestamp,
	updateDoc,
	writeBatch,
} from "firebase/firestore";

import type { ColorRole, Theme } from "@/lib/theme";
import { buildThemeHref } from "@/lib/theme";
import type { Typography } from "@/lib/typography";

export type PaletteDocInput = {
	name: string;
	roles: Array<ColorRole>;
	typography: Typography | null;
	href: string;
	semanticNamesLocked?: boolean;
};

export type SavedPalette = PaletteDocInput & {
	id: string;
	createdAt: string | null;
	updatedAt: string | null;
};

type PaletteFirestoreDoc = PaletteDocInput & {
	createdAt?: Timestamp;
	updatedAt?: Timestamp;
};

const SAFE_PALETTE_HREF =
	/^\/generate\/[0-9a-fA-F]{3,8}(\?[\w=&~.,%!'()*-]*)?$/;

function stripUndefined<T>(value: T): T {
	if (Array.isArray(value)) {
		return value.map((item) => stripUndefined(item)) as T;
	}
	if (value && typeof value === "object") {
		const cleaned: Record<string, unknown> = {};
		for (const [key, child] of Object.entries(value)) {
			if (child !== undefined) {
				cleaned[key] = stripUndefined(child);
			}
		}
		return cleaned as T;
	}
	return value;
}

function timestampToIso(value: Timestamp | undefined): string | null {
	return value ? value.toDate().toISOString() : null;
}

export function paletteDocFromState(
	theme: Theme,
	typography: Typography,
): PaletteDocInput {
	const cleanedTheme = stripUndefined(theme);
	const primary = cleanedTheme.roles[0];
	const hex = primary?.hex ?? "#000000";

	return {
		name: `${primary?.name ?? "Palette"} ${hex}`,
		roles: cleanedTheme.roles,
		...(cleanedTheme.semanticNamesLocked !== undefined
			? { semanticNamesLocked: cleanedTheme.semanticNamesLocked }
			: {}),
		typography: stripUndefined(typography),
		href: buildThemeHref(cleanedTheme, typography),
	};
}

export function isSafePaletteHref(href: string): boolean {
	return SAFE_PALETTE_HREF.test(href);
}

const paletteConverter: FirestoreDataConverter<PaletteFirestoreDoc> = {
	toFirestore(palette: WithFieldValue<PaletteFirestoreDoc>): DocumentData {
		return palette;
	},
	fromFirestore(
		snapshot: QueryDocumentSnapshot,
		options: SnapshotOptions,
	): PaletteFirestoreDoc {
		return snapshot.data(options) as PaletteFirestoreDoc;
	},
};

function palettesCollection(db: Firestore, uid: string) {
	return collection(db, "users", uid, "palettes").withConverter(
		paletteConverter,
	);
}

const DELETE_BATCH_SIZE = 500;

export async function savePalette(
	db: Firestore,
	uid: string,
	input: PaletteDocInput,
): Promise<string> {
	const docRef = await addDoc(palettesCollection(db, uid), {
		...stripUndefined(input),
		createdAt: serverTimestamp(),
		updatedAt: serverTimestamp(),
	});
	return docRef.id;
}

export async function updatePalette(
	db: Firestore,
	uid: string,
	id: string,
	input: PaletteDocInput,
): Promise<void> {
	await updateDoc(doc(db, "users", uid, "palettes", id), {
		...stripUndefined(input),
		updatedAt: serverTimestamp(),
	});
}

export async function listPalettes(
	db: Firestore,
	uid: string,
): Promise<Array<SavedPalette>> {
	const snapshot = await getDocs(
		query(
			palettesCollection(db, uid),
			orderBy("updatedAt", "desc"),
			limit(100),
		),
	);
	return snapshot.docs.map((paletteDoc) => {
		const data = paletteDoc.data();
		return {
			id: paletteDoc.id,
			name: data.name,
			roles: data.roles,
			...(data.semanticNamesLocked !== undefined
				? { semanticNamesLocked: data.semanticNamesLocked }
				: {}),
			typography: data.typography,
			href: data.href,
			createdAt: timestampToIso(data.createdAt),
			updatedAt: timestampToIso(data.updatedAt),
		};
	});
}

export async function deletePalette(
	db: Firestore,
	uid: string,
	id: string,
): Promise<void> {
	await deleteDoc(doc(db, "users", uid, "palettes", id));
}

export async function deleteAllPalettes(
	db: Firestore,
	uid: string,
): Promise<void> {
	while (true) {
		const snapshot = await getDocs(
			query(palettesCollection(db, uid), limit(DELETE_BATCH_SIZE)),
		);

		if (snapshot.docs.length === 0) {
			return;
		}

		const batch = writeBatch(db);
		for (const paletteDoc of snapshot.docs) {
			batch.delete(paletteDoc.ref);
		}
		await batch.commit();

		if (snapshot.docs.length < DELETE_BATCH_SIZE) {
			return;
		}
	}
}

export async function renamePalette(
	db: Firestore,
	uid: string,
	id: string,
	name: string,
): Promise<void> {
	await updateDoc(doc(db, "users", uid, "palettes", id), {
		name: name.trim(),
		updatedAt: serverTimestamp(),
	});
}
