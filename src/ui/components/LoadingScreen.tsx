import React from "react";

export default function LoadingScreen() {
    return (
        <div className="min-h-screen w-full bg-charcoal-950 text-white">
            <div className="mx-auto flex min-h-screen w-full max-w-2xl items-center justify-center px-6">
                <div className="flex flex-col items-center gap-3 text-center">
                    <span
                        className="h-6 w-6 animate-spin border-2 border-white/20 border-t-white"
                        aria-hidden="true"
                    />
                    <p className="text-sm font-medium tracking-wide text-white/90">
                        Preparing your environment...
                    </p>
                    <p className="font-mono text-xs text-white/60">
                        pdflatex initializing...
                    </p>
                </div>
            </div>
        </div>
    );
}
