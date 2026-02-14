interface LogoProps {
  size?: 'compact' | 'default' | 'large';
  showText?: boolean;
}

export default function Logo({ size = 'default', showText = true }: LogoProps) {
  const markSize = size === 'large' ? 72 : size === 'compact' ? 34 : 52;
  const ringWidth = size === 'large' ? 3 : size === 'compact' ? 2 : 2.5;
  const arrowLen = size === 'large' ? 22 : size === 'compact' ? 11 : 16;
  const arrowH = size === 'large' ? 3 : size === 'compact' ? 2 : 2.5;
  const chevSize = size === 'large' ? 12 : size === 'compact' ? 7 : 9;
  const dotSize = size === 'large' ? 8 : size === 'compact' ? 4 : 6;
  const fadeDotSize = size === 'large' ? 6 : size === 'compact' ? 3 : 5;
  const wordSize = size === 'large' ? 'text-5xl' : size === 'compact' ? 'text-[22px]' : 'text-[32px]';
  const gap = size === 'large' ? 'gap-5' : size === 'compact' ? 'gap-2.5' : 'gap-3.5';

  return (
    <div className={`flex items-center ${gap}`}>
      {/* Logo mark */}
      <div className="relative shrink-0" style={{ width: markSize, height: markSize }}>
        {/* Glow */}
        <div
          className="absolute rounded-full"
          style={{
            inset: -10,
            background: 'radial-gradient(circle, rgba(0,212,170,0.12) 0%, transparent 70%)',
            zIndex: 0,
          }}
        />
        {/* Ring */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            border: `${ringWidth}px solid transparent`,
            borderTopColor: '#00D4AA',
            borderRightColor: '#00D4AA',
            borderBottomColor: 'rgba(0,212,170,0.25)',
            borderLeftColor: 'rgba(0,212,170,0.25)',
            transform: 'rotate(-45deg)',
          }}
        />
        {/* Arrow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          {/* Line */}
          <div
            className="absolute top-1/2 rounded-sm"
            style={{
              left: size === 'compact' ? 1 : 2,
              width: arrowLen,
              height: arrowH,
              background: '#00D4AA',
              transform: 'translateY(-50%)',
            }}
          />
          {/* Chevron */}
          <div
            className="absolute top-1/2 right-0"
            style={{
              width: chevSize,
              height: chevSize,
              borderTop: `${arrowH}px solid #00D4AA`,
              borderRight: `${arrowH}px solid #00D4AA`,
              transform: 'translateY(-50%) rotate(45deg)',
              borderRadius: '0 2px 0 0',
            }}
          />
        </div>
        {/* Dots */}
        <div
          className="absolute rounded-full"
          style={{
            width: dotSize,
            height: dotSize,
            background: '#00D4AA',
            boxShadow: '0 0 8px rgba(0,212,170,0.6)',
            top: -1,
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: dotSize,
            height: dotSize,
            background: '#00D4AA',
            boxShadow: '0 0 8px rgba(0,212,170,0.6)',
            top: '50%',
            right: -1,
            transform: 'translateY(-50%)',
          }}
        />
        <div
          className="absolute rounded-full"
          style={{
            width: fadeDotSize,
            height: fadeDotSize,
            background: 'rgba(0,212,170,0.35)',
            bottom: size === 'large' ? 10 : size === 'compact' ? 5 : 8,
            right: size === 'large' ? 5 : size === 'compact' ? 2 : 3,
          }}
        />
      </div>

      {/* Text */}
      {showText && (
        <div className="flex flex-col">
          <div className={`${wordSize} font-extrabold leading-none tracking-tight font-heading`}>
            <span className="text-white">Visa</span>
            <span className="text-teal-400">Path</span>
          </div>
          {size !== 'compact' && (
            <div className="text-[10px] font-semibold tracking-[2.5px] uppercase text-white/35 mt-1">
              Your Immigration Timeline
            </div>
          )}
        </div>
      )}
    </div>
  );
}
