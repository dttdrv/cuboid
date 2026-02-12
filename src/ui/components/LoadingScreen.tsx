

export default function LoadingScreen() {
    return (
        <div className="min-h-screen w-full bg-page-bg text-text-primary">
            <div className="mx-auto flex min-h-screen w-full max-w-2xl items-center justify-center px-6">
                <div className="flex flex-col items-center gap-3 text-center">
                    <span
                        className="h-6 w-6 animate-spin rounded-full border-2 border-text-muted/30 border-t-accent"
                        aria-hidden="true"
                    />
                    <p className="text-sm font-medium tracking-wide text-text-primary">
                        Preparing your environment…
                    </p>
                    <p className="font-mono text-xs text-text-muted">
                        cuboid initializing
                    </p>
                </div>
            </div>
        </div>
    );
}
