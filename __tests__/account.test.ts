import { beforeEach, describe, expect, it, vi } from "vitest";

const firebaseState = vi.hoisted(() => ({
	auth: null as { currentUser: unknown } | null,
	db: null as unknown,
}));

const authState = vi.hoisted(() => ({
	reauthenticateWithPopup: vi.fn(),
	deleteUser: vi.fn(),
}));

const firestoreState = vi.hoisted(() => ({
	calls: [] as Array<string>,
	getDocs: vi.fn(),
	writeBatch: vi.fn(),
}));

const trackEvent = vi.hoisted(() => vi.fn());

vi.mock("client-only", () => ({}));
vi.mock("@/lib/firebase", () => ({
	getFirebaseAuth: () => firebaseState.auth,
	getFirebaseDb: () => firebaseState.db,
}));
vi.mock("@/lib/analytics", () => ({
	trackEvent,
}));
vi.mock("firebase/auth", () => ({
	GoogleAuthProvider: class GoogleAuthProvider {
		providerId = "google";
	},
	TwitterAuthProvider: class TwitterAuthProvider {
		providerId = "twitter";
	},
	FacebookAuthProvider: class FacebookAuthProvider {
		providerId = "facebook";
	},
	reauthenticateWithPopup: (...args: Array<unknown>) => {
		firestoreState.calls.push("reauth");
		return authState.reauthenticateWithPopup(...args);
	},
	deleteUser: (...args: Array<unknown>) => {
		firestoreState.calls.push("deleteUser");
		return authState.deleteUser(...args);
	},
}));
vi.mock("firebase/firestore", () => ({
	addDoc: vi.fn(),
	collection: vi.fn(() => ({
		withConverter: vi.fn(() => ({ type: "collection" })),
	})),
	deleteDoc: vi.fn(),
	doc: vi.fn(),
	getDocs: (...args: Array<unknown>) => firestoreState.getDocs(...args),
	limit: vi.fn((count: number) => ({ type: "limit", count })),
	orderBy: vi.fn(),
	query: vi.fn((...args: Array<unknown>) => ({ type: "query", args })),
	serverTimestamp: vi.fn(),
	updateDoc: vi.fn(),
	writeBatch: (...args: Array<unknown>) => firestoreState.writeBatch(...args),
}));

function user(providerId?: string) {
	return {
		uid: "user-1",
		providerData: providerId === undefined ? [] : [{ providerId }],
	};
}

function makeBatch() {
	return {
		delete: vi.fn(() => {
			firestoreState.calls.push("paletteDelete");
		}),
		commit: vi.fn(() => {
			firestoreState.calls.push("paletteCommit");
			return Promise.resolve();
		}),
	};
}

describe("deleteAccount", () => {
	beforeEach(() => {
		firebaseState.auth = { currentUser: user("google.com") };
		firebaseState.db = { app: "db" };
		authState.reauthenticateWithPopup.mockReset();
		authState.reauthenticateWithPopup.mockResolvedValue(undefined);
		authState.deleteUser.mockReset();
		authState.deleteUser.mockResolvedValue(undefined);
		firestoreState.calls = [];
		firestoreState.getDocs.mockReset();
		firestoreState.getDocs.mockResolvedValue({ docs: [] });
		firestoreState.writeBatch.mockReset();
		firestoreState.writeBatch.mockImplementation(makeBatch);
		trackEvent.mockReset();
	});

	it("reauthenticates, deletes palettes, deletes the auth user, and tracks success in order", async () => {
		const { deleteAccount } = await import("@/lib/account");
		firestoreState.getDocs.mockResolvedValueOnce({
			docs: [{ ref: { id: "palette-1" } }],
		});

		await deleteAccount();

		expect(firestoreState.calls).toEqual([
			"reauth",
			"paletteDelete",
			"paletteCommit",
			"deleteUser",
		]);
		expect(trackEvent).toHaveBeenCalledWith("account_deleted");
	});

	it.each([
		"auth/popup-closed-by-user",
		"auth/cancelled-popup-request",
		"auth/user-cancelled",
	])(
		"stops before deleting anything when reauthentication is cancelled with %s",
		async (code) => {
			const { deleteAccount } = await import("@/lib/account");
			authState.reauthenticateWithPopup.mockRejectedValueOnce({ code });

			await expect(deleteAccount()).rejects.toMatchObject({
				stage: "reauth",
				code,
			});
			expect(firestoreState.writeBatch).not.toHaveBeenCalled();
			expect(authState.deleteUser).not.toHaveBeenCalled();
			expect(trackEvent).not.toHaveBeenCalled();
		},
	);

	it("reports auth-delete failures after palette data was deleted", async () => {
		const { deleteAccount } = await import("@/lib/account");
		firestoreState.getDocs.mockResolvedValueOnce({
			docs: [{ ref: { id: "palette-1" } }],
		});
		authState.deleteUser.mockRejectedValueOnce({ code: "auth/internal-error" });

		await expect(deleteAccount()).rejects.toMatchObject({
			stage: "auth-delete",
			code: "auth/internal-error",
		});
		expect(firestoreState.calls).toEqual([
			"reauth",
			"paletteDelete",
			"paletteCommit",
			"deleteUser",
		]);
		expect(trackEvent).not.toHaveBeenCalled();
	});

	it("requires Firebase auth, Firestore, and a signed-in user", async () => {
		const { deleteAccount } = await import("@/lib/account");

		firebaseState.auth = null;
		await expect(deleteAccount()).rejects.toMatchObject({
			stage: "precondition",
		});

		firebaseState.auth = { currentUser: user("google.com") };
		firebaseState.db = null;
		await expect(deleteAccount()).rejects.toMatchObject({
			stage: "precondition",
		});

		firebaseState.db = { app: "db" };
		firebaseState.auth = { currentUser: null };
		await expect(deleteAccount()).rejects.toMatchObject({
			stage: "precondition",
		});

		expect(authState.reauthenticateWithPopup).not.toHaveBeenCalled();
		expect(firestoreState.writeBatch).not.toHaveBeenCalled();
		expect(authState.deleteUser).not.toHaveBeenCalled();
	});

	it.each([
		["google.com", "google"],
		["twitter.com", "twitter"],
		["facebook.com", "facebook"],
		["password", "google"],
		[undefined, "google"],
	])("maps Firebase provider %s to local provider %s", async (firebaseId, localId) => {
		const { deleteAccount } = await import("@/lib/account");
		firebaseState.auth = { currentUser: user(firebaseId) };

		await deleteAccount();

		expect(authState.reauthenticateWithPopup).toHaveBeenCalledWith(
			firebaseState.auth.currentUser,
			expect.objectContaining({ providerId: localId }),
		);
	});
});
