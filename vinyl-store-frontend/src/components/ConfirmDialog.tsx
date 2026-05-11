type Props = {
    open: boolean;
    title: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'primary';
    onConfirm: () => void;
    onCancel: () => void;
    loading?: boolean;
};

export default function ConfirmDialog({
    open,
    title,
    description,
    confirmText = 'Подтвердить',
    cancelText = 'Отмена',
    variant = 'primary',
    onConfirm,
    onCancel,
    loading
}: Props) {
    if (!open) return null;

    const confirmClasses = variant === 'danger'
        ? 'bg-red-700 text-white'
        : 'bg-[var(--ink)] text-white';

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/45 p-6">
            <div className="w-full max-w-lg bg-[var(--paper-soft)] p-8 poster-border">
                <div className="display-font text-4xl leading-none">{title}</div>
                {description && <div className="mt-4 text-[var(--muted)]">{description}</div>}

                <div className="mt-8 flex gap-3">
                    <button
                        onClick={onCancel}
                        disabled={loading}
                        className="flex-1 border-2 border-[var(--line)] bg-white px-4 py-4 font-black uppercase tracking-[0.12em] disabled:opacity-60"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className={`flex-1 border-2 border-[var(--line)] px-4 py-4 font-black uppercase tracking-[0.12em] disabled:opacity-60 ${confirmClasses}`}
                    >
                        {loading ? 'Подождите...' : confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
