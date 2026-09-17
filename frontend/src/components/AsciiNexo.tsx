// ponytail: Lightweight animated ASCII terminal banner for Nexo Console
import React, { useState, useEffect, useCallback } from 'react';

const TARGET_ASCII = [
  "███╗   ██╗███████╗██╗  ██╗ ██████╗ ",
  "████╗  ██║██╔════╝╚██╗██╔╝██╔═══██╗",
  "██╔██╗ ██║█████╗   ╚███╔╝ ██║   ██║",
  "██║╚██╗██║██╔══╝   ██╔██╗ ██║   ██║",
  "██║ ╚████║███████╗██╔╝ ██╗╚██████╔╝",
  "╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ "
];

const GLYPHS = "01_/*[]<>|#%&+=~";

export const AsciiNexo: React.FC = () => {
  const [renderedLines, setRenderedLines] = useState<string[]>(TARGET_ASCII);
  const [animating, setAnimating] = useState(true);

  const startAnimation = useCallback(() => {
    setAnimating(true);
    let frame = 0;
    const totalFrames = 15;

    const interval = setInterval(() => {
      frame++;
      const progress = frame / totalFrames;

      if (frame >= totalFrames) {
        setRenderedLines(TARGET_ASCII);
        setAnimating(false);
        clearInterval(interval);
      } else {
        setRenderedLines(
          TARGET_ASCII.map((targetLine) =>
            targetLine
              .split('')
              .map((targetChar, idx) => {
                if (targetChar === ' ') return ' ';
                if (idx / targetLine.length < progress) {
                  return targetChar;
                }
                return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
              })
              .join('')
          )
        );
      }
    }, 40);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const cleanup = startAnimation();
    return () => {
      if (cleanup) cleanup();
    };
  }, [startAnimation]);

  return (
    <div
      onClick={startAnimation}
      className="cursor-pointer select-none font-mono flex flex-col items-center group py-2"
      title="Click para reiniciar animación"
    >
      <pre className="text-emerald-400 text-[10px] sm:text-xs md:text-sm font-bold leading-none tracking-widest text-center transition-all duration-300 drop-shadow-[0_0_10px_rgba(52,211,153,0.35)] group-hover:drop-shadow-[0_0_16px_rgba(52,211,153,0.6)]">
        {renderedLines.join('\n')}
      </pre>
      <div className="flex items-center gap-2 mt-2.5 font-mono text-[10px] text-nexo-400">
        <span
          className={`inline-block w-1.5 h-1.5 rounded-full ${
            animating ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'
          }`}
        />
        <span className="tracking-wider uppercase text-[10px] text-nexo-500">
          {animating ? '[DECRYPTING NEXO NEURAL CORE...]' : '[NEXO // RAG INFERENCE READY]'}
        </span>
      </div>
    </div>
  );
};
