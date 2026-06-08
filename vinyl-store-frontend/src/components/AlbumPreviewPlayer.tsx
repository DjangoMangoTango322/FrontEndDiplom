import { useEffect, useState } from 'react';
import { AlertTriangle, Disc3 } from 'lucide-react';
import api from '../api/api';
import type { Album } from '../types';

type Props = {
    album: Album;
};

type PreviewState = {
    status: 'idle' | 'loading' | 'ready' | 'missing' | 'error';
    previewUrl?: string;
    message?: string;
};

export default function AlbumPreviewPlayer({ album }: Props) {
    const [preview, setPreview] = useState<PreviewState>({ status: 'idle' });

    useEffect(() => {
        setPreview({ status: 'idle' });
    }, [album.albumID]);

    const handleLoadPreview = async () => {
        if (!album.artist?.name || preview.status === 'loading') {
            return;
        }

        setPreview({ status: 'loading' });

        try {
            const response = await api.get<{ previewUrl: string }>('/preview', {
                params: {
                    artist: album.artist.name,
                    album: album.title,
                },
            });

            if (!response.data.previewUrl) {
                setPreview({
                    status: 'missing',
                    message: 'Для этого релиза не нашлось доступного превью.',
                });
                return;
            }

            setPreview({
                status: 'ready',
                previewUrl: response.data.previewUrl,
            });
        } catch (error) {
            const status = (error as { response?: { status?: number } }).response?.status;
            setPreview({
                status: status === 404 ? 'missing' : 'error',
                message: status === 404
                    ? 'Для этого релиза не нашлось доступного превью.'
                    : 'Не удалось получить превью. Попробуйте еще раз чуть позже.',
            });
        }
    };

    return (
        <div className="space-y-3">
            {preview.status !== 'ready' && (
                <button
                    type="button"
                    onClick={handleLoadPreview}
                    disabled={!album.artist?.name || preview.status === 'loading'}
                    className="inline-flex items-center justify-center gap-3 border-2 border-[var(--line)] bg-[var(--sun)] px-5 py-3 font-black uppercase tracking-[0.14em] disabled:opacity-60"
                >
                    <Disc3 className={`h-5 w-5 ${preview.status === 'loading' ? 'animate-spin' : ''}`} />
                    {preview.status === 'loading' ? 'Ищем превью...' : 'Слушать превью'}
                </button>
            )}

            {preview.status === 'ready' && preview.previewUrl && (
                <div className="space-y-2 border-2 border-[var(--line)] bg-white p-4">
                    <div className="text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">
                        30-секундное превью из iTunes
                    </div>
                    <audio controls preload="none" src={preview.previewUrl} className="w-full">
                        Ваш браузер не поддерживает воспроизведение аудио.
                    </audio>
                </div>
            )}

            {(preview.status === 'missing' || preview.status === 'error') && preview.message && (
                <div className="flex items-start gap-3 border-2 border-[var(--line)] bg-[var(--paper-soft)] p-4 text-sm font-semibold text-[var(--muted)]">
                    <AlertTriangle className="mt-0.5 h-4 w-4 text-[var(--coral)]" />
                    <span>{preview.message}</span>
                </div>
            )}
        </div>
    );
}
