import React from "react";

export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-100 p-6 text-center text-slate-800">
                    <p className="text-lg font-semibold">Something went wrong.</p>
                    <p className="text-sm text-slate-600 max-w-md">Try refreshing the page. Your data is stored in this browser.</p>
                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="rounded-full bg-slate-900 px-5 py-2.5 text-white text-sm font-medium shadow hover:bg-slate-800"
                    >
                        Reload
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
