import { Delete } from "lucide-react";

interface KeyboardProps {
  onKeyPress: (key: string) => void;
  letterStatuses: Record<string, 'correct' | 'present' | 'absent' | 'unused'>;
}

const ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']
];

export function Keyboard({ onKeyPress, letterStatuses }: KeyboardProps) {
  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-2 mt-8 px-2 select-none">
      {ROWS.map((row, i) => (
        <div key={i} className="flex justify-center gap-1.5 sm:gap-2">
          {row.map((key) => {
            const isEnter = key === 'ENTER';
            const isBackspace = key === 'BACKSPACE';
            const status = letterStatuses[key] || 'unused';

            let statusClass = 'keyboard-key-default';
            if (status === 'correct') statusClass = 'keyboard-key-correct';
            else if (status === 'present') statusClass = 'keyboard-key-present';
            else if (status === 'absent') statusClass = 'keyboard-key-absent';

            return (
              <button
                key={key}
                onClick={() => onKeyPress(key)}
                className={`keyboard-key ${statusClass} ${
                  isEnter || isBackspace ? 'px-3 sm:px-4 text-xs sm:text-sm max-w-[80px]' : 'max-w-[40px] sm:max-w-[50px]'
                }`}
                aria-label={key}
              >
                {isBackspace ? <Delete className="w-5 h-5" /> : key}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
