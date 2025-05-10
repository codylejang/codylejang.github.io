import { useState, useEffect, useRef } from 'react';
import FadingLine from './fadingline';
import FooterTabs from './FooterTabs';

const baseLines = [
  'MY NAME IS CODY.',
  'I’M A DEVELOPER AND RESEARCHER.',
  'I WORK AT THE INTERSECTION OF',
  'PSYCHOLOGY, DATA SCIENCE, AND MACHINE LEARNING.',
  'MY APPROACH IS TECHNICALLY GROUNDED,',
  'AND ARTISTICALLY DRIVEN.',
  'I CONSTRUCT SYSTEMS, STUDY HUMAN BEHAVIOR,',
  'AND TRANSLATE IDEAS INTO SOFTWARE.',
  'WELCOME TO MY WORLD.',
];

function App() {
  const [visibleLines, setVisibleLines] = useState([]);
  const indexRef = useRef(0);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const addLine = () => {
      if (indexRef.current < baseLines.length) {
        const newLine = {
          text: baseLines[indexRef.current],
          id: `${indexRef.current}-${Date.now()}`,
          appearTime: Date.now(),
          lineIndex: indexRef.current, // Freeze ending position, static instead of floating upward
        };

        setVisibleLines(prev => [...prev, newLine]);
        indexRef.current++;
        timeoutRef.current = setTimeout(addLine, 2500);
      } else {
        // Wait for all lines to fade before restart
        timeoutRef.current = setTimeout(() => {
          setVisibleLines([]);
          indexRef.current = 0;
          timeoutRef.current = setTimeout(addLine, 0);
        }, 5800); // ~6s display before loop, accounts for full fade of last line
      }
    };

    const cleanUpLines = () => {
      const now = Date.now();
      setVisibleLines(prev =>
        prev.filter(line =>
          now - line.appearTime < 9000 // 6s display + 2s fade + 1s buffer
        )
      );
    };

    const cleanUpInterval = setInterval(cleanUpLines, 1000);
    timeoutRef.current = setTimeout(addLine, 0);

    return () => {
      clearTimeout(timeoutRef.current);
      clearInterval(cleanUpInterval);
    };
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-white text-black">
      <div className="absolute top-[20%] left-0 w-full px-2 sm:px-4">
        {visibleLines.map((line) => (
          <FadingLine
            key={line.id}
            text={line.text}
            lineIndex={line.lineIndex}
          />
        ))}
      </div>
      <FooterTabs />
    </div>
  );
}

export default App;
