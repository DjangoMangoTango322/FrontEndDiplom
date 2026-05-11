import { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error';

export type ToastState = {
    open: boolean;
    type: ToastType;
    title: string;
    description?: string;
};

type Props = ToastState & {
    onClose: () => void;
    durationMs?: number;
};

export default function Toast({ open, type, title, description, onClose, durationMs = 3500 }: Props) {
    useEffect(() => {
        if (!open) return;
        const t = window.setTimeout(onClose, durationMs);
        return () => window.clearTimeout(t);
    }, [open, durationMs, onClose]);

    if (!open) return null;

    const icon = type === 'success'
        ? <CheckCircle2 className="h-5 w-5 text-[var(--blue)]" />
        : <AlertTriangle className="h-5 w-5 text-red-700" />;

    return (
        <div className="fixed left-5 right-5 top-6 z-[260] md:left-auto md:w-[420px]">
            <div className="bg-[var(--paper-soft)] p-5 poster-border-sm">
                <div className="flex items-start gap-3">
                    <div className="mt-0.5">{icon}</div>
                    <div className="min-w-0 flex-1">
                        <div className="font-black">{title}</div>
                        {description && <div className="mt-1 text-sm font-medium text-[var(--muted)]">{description}</div>}
                    </div>
                    <button onClick={onClose} className="grid h-9 w-9 place-items-center border-2 border-[var(--line)] bg-white" title="Закрыть">
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
