import "client-only";

import type { FirebaseApp, FirebaseOptions } from "firebase/app";
import { getApps, initializeApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import { getAuth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";
import { getFirestore } from "firebase/firestore";

function getFirebaseConfig(): FirebaseOptions | null {
	const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
	const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
	const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
	const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

	if (!apiKey || !authDomain || !projectId || !appId) {
		return null;
	}

	return {
		apiKey,
		authDomain,
		projectId,
		appId,
		...(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
			? { storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET }
			: {}),
		...(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
			? {
					messagingSenderId:
						process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
				}
			: {}),
	};
}

export function isFirebaseEnabled(): boolean {
	return getFirebaseConfig() !== null;
}

export function getFirebaseApp(): FirebaseApp | null {
	const config = getFirebaseConfig();
	if (!config) {
		return null;
	}
	return getApps()[0] ?? initializeApp(config);
}

export function getFirebaseAuth(): Auth | null {
	const app = getFirebaseApp();
	return app ? getAuth(app) : null;
}

export function getFirebaseDb(): Firestore | null {
	const app = getFirebaseApp();
	return app ? getFirestore(app) : null;
}
