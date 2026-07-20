"use client";

import React, { Component } from "react";

import type { ErrorInfo, ReactNode } from "react";

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
}

interface State {
	hasError: boolean;
	error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
	public state: State = {
		hasError: false,
		error: null,
	};

	public static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error("ErrorBoundary caught an error:", error, errorInfo);
	}

	public render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback;
			}
			return (
				<div className="flex min-h-screen flex-col items-center justify-center bg-black p-6 text-center text-white">
					<h2 className="mb-2 text-xl font-bold text-red-500">Something went wrong</h2>
					<p className="mb-4 max-w-md text-sm text-neutral-400">
						{this.state.error?.message || "An unexpected error occurred."}
					</p>
					<button
						onClick={() => this.setState({ hasError: false, error: null })}
						className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold transition hover:bg-purple-500"
					>
						Try again
					</button>
				</div>
			);
		}

		return this.props.children;
	}
}
export default ErrorBoundary;
