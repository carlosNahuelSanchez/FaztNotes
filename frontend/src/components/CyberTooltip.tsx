// ponytail: Zero-dependency animated ASCII/Cyber decoding tooltip for terminal buttons
import React, { useState, useEffect, useRef } from 'react';

interface CyberTooltipProps {
  text: string;
  children: React.ReactNode;
  className?: string;
  position?: 'top' | 'bottom';
  maxWidth?: string;
}

const GLYPHS = "!<>-_\\/[]{}—=+*^?#_$%&01";

export const CyberTooltip: React.FC<CyberTooltipProps> = ({
  text,
  children,
  className = '',
  position = 'bottom',
  maxWidth
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [displayText, setDisplayText] = useState(text);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isHovered) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setDisplayText(text);
      return;
    }

    let frame = 0;
    const totalFrames = 10;

    intervalRef.current = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;

      if (frame >= totalFrames) {
        setDisplayText(text);
        if (intervalRef.current) clearInterval(intervalRef.current);
      } else {
        setDisplayText(
          text
            .split('')
            .map((char, idx) => {
              if (char === ' ') return ' ';
              if (idx / text.length < progress) {
                return char;
              }
              return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
            })
            .join('')
        );
      }
    }, 28);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isHovered, text]);

  const isBottom = position === 'bottom';

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isHovered && (
        <div
          className={`absolute ${
            isBottom ? 'top-full mt-2' : 'bottom-full mb-2'
          } left-1/2 -translate-x-1/2 z-50 pointer-events-none ${
            maxWidth ? `${maxWidth} whitespace-normal text-left leading-tight` : 'whitespace-nowrap'
          } bg-black/95 border border-emerald-500/80 text-emerald-300 font-mono text-[10px] px-2 py-1 shadow-xl shadow-emerald-950/60 flex items-start gap-1`}
        >
          <span className="text-emerald-400 font-bold shrink-0">&gt;</span>
          <span>{displayText}</span>
          {/* Arrow */}
          <div
            className={`absolute ${
              isBottom ? 'bottom-full border-b-emerald-500/80' : 'top-full border-t-emerald-500/80'
            } left-1/2 -translate-x-1/2 border-4 border-transparent w-0 h-0`}
          />
        </div>
      )}
      {children}
    </div>
  );
};
