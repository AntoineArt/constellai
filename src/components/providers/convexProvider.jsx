'use client';
import { useRef } from 'react';
import { ConvexProvider, ConvexReactClient } from 'convex/react';

export default function ConvexClientProvider({ children }) {
	const clientRef = useRef(null);
	if (!clientRef.current) {
		const url = process.env.NEXT_PUBLIC_CONVEX_URL || '';
		clientRef.current = new ConvexReactClient(url);
	}
	return <ConvexProvider client={clientRef.current}>{children}</ConvexProvider>;
}


