import type { CSSProperties } from 'react';

type VinylDisc = {
    discClassName: string;
    discStyle: CSSProperties;
    shellClassName: string;
};

const discs: VinylDisc[] = [
    {
        shellClassName: 'vinyl-disc-shell vinyl-disc-shell--top-right',
        discClassName: 'vinyl-disc vinyl-disc--gold',
        discStyle: { animationDuration: '58s' },
    },
    {
        shellClassName: 'vinyl-disc-shell vinyl-disc-shell--left-mid',
        discClassName: 'vinyl-disc vinyl-disc--blue vinyl-disc--reverse',
        discStyle: { animationDuration: '64s' },
    },
    {
        shellClassName: 'vinyl-disc-shell vinyl-disc-shell--bottom-right',
        discClassName: 'vinyl-disc vinyl-disc--coral',
        discStyle: { animationDuration: '72s' },
    },
    {
        shellClassName: 'vinyl-disc-shell vinyl-disc-shell--top-left',
        discClassName: 'vinyl-disc vinyl-disc--mint vinyl-disc--reverse',
        discStyle: { animationDuration: '52s' },
    },
];

export default function VinylBackground() {
    return (
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
            <div className="vinyl-aura vinyl-aura--sun" />
            <div className="vinyl-aura vinyl-aura--mint" />
            <div className="vinyl-aura vinyl-aura--coral" />

            {discs.map(({ shellClassName, discClassName, discStyle }, index) => (
                <div key={index} className={shellClassName}>
                    <div className={discClassName} style={discStyle} />
                </div>
            ))}
        </div>
    );
}
