import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { useAuth } from "@/hooks/use-auth";
import { useTodayGame, useSubmitGuess } from "@/hooks/use-game";
import { Navbar } from "@/components/Navbar";
import { Keyboard } from "@/components/Keyboard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Loader2, Share2, BarChart2, AlertCircle, Trophy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const MAX_GUESSES = 6;

export default function Game() {
  const [_, setLocation] = useLocation();
  const { data: user, isLoading: authLoading } = useAuth();
  const { data: game, isLoading: gameLoading, error: gameError } = useTodayGame();
  const submitMutation = useSubmitGuess();
  const { toast } = useToast();

  const [currentGuess, setCurrentGuess] = useState("");
  const [showWinDialog, setShowWinDialog] = useState(false);
  const [showLoseDialog, setShowLoseDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Authentication check
  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/auth");
    }
  }, [user, authLoading, setLocation]);

  // Determine game state
  const isGameOver = game?.gameState?.isGameOver || false;
  const isSolved = game?.gameState?.isSolved || false;
  const previousGuesses = game?.gameState?.guesses || [];
  const evaluations = game?.gameState?.evaluations || [];
  const currentRowIndex = previousGuesses.length;

  // Handle Win/Lose dialogs mounting
  useEffect(() => {
    if (isGameOver) {
      if (isSolved) {
        setTimeout(() => setShowWinDialog(true), 1500); // Wait for flips
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#22c55e', '#eab308', '#3b82f6']
        });
      } else {
        setTimeout(() => setShowLoseDialog(true), 1500);
      }
    }
  }, [isGameOver, isSolved]);

  const onKeyPress = useCallback((key: string) => {
    if (isGameOver || isSubmitting || !game) return;

    if (key === "ENTER") {
      if (currentGuess.length !== game.length) {
        toast({ title: "Not enough letters", variant: "destructive" });
        // Add shake animation logic here if desired
        return;
      }
      
      setIsSubmitting(true);
      submitMutation.mutate(
        { guess: currentGuess, date: format(new Date(), 'yyyy-MM-dd') },
        {
          onSuccess: () => {
            setCurrentGuess("");
            setIsSubmitting(false);
          },
          onError: (err: any) => {
            toast({ title: "Error", description: err.message, variant: "destructive" });
            setIsSubmitting(false);
          }
        }
      );
    } else if (key === "BACKSPACE") {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (/^[A-Z]$/.test(key) && currentGuess.length < game.length) {
      setCurrentGuess(prev => prev + key);
    }
  }, [currentGuess, game, isGameOver, isSubmitting, submitMutation, toast]);

  // Physical keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      
      let key = e.key.toUpperCase();
      if (e.key === "Enter") key = "ENTER";
      if (e.key === "Backspace") key = "BACKSPACE";
      
      if (key === "ENTER" || key === "BACKSPACE" || /^[A-Z]$/.test(key)) {
        onKeyPress(key);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onKeyPress]);

  if (authLoading || gameLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (gameError || !game) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4 text-center">
          <div className="glass-panel p-8 rounded-3xl max-w-md w-full">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold font-display mb-2">No Game Found</h2>
            <p className="text-muted-foreground mb-6">There might not be a puzzle available for today yet. Come back later!</p>
            <Button onClick={() => window.location.reload()}>Refresh Page</Button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate keyboard letter statuses
  const letterStatuses: Record<string, 'correct' | 'present' | 'absent' | 'unused'> = {};
  previousGuesses.forEach((guess, i) => {
    const rowEvals = evaluations[i];
    if (!rowEvals) return;
    
    for (let j = 0; j < guess.length; j++) {
      const letter = guess[j];
      const ev = rowEvals[j];
      const currentStatus = letterStatuses[letter];
      
      if (ev === 'correct') {
        letterStatuses[letter] = 'correct';
      } else if (ev === 'present' && currentStatus !== 'correct') {
        letterStatuses[letter] = 'present';
      } else if (ev === 'absent' && currentStatus !== 'correct' && currentStatus !== 'present') {
        letterStatuses[letter] = 'absent';
      }
    }
  });

  const handleShare = () => {
    const totalGuesses = isSolved ? previousGuesses.length : 'X';
    const gridText = evaluations.map(row => 
      row.map(ev => ev === 'correct' ? '🟩' : ev === 'present' ? '🟨' : '⬛').join('')
    ).join('\n');
    
    const text = `Athletics Daily ${format(new Date(), 'MMM d')}\n${totalGuesses}/${MAX_GUESSES}\n\n${gridText}`;
    
    if (navigator.share) {
      navigator.share({ title: 'Athletics Daily', text });
    } else {
      navigator.clipboard.writeText(text);
      toast({ title: "Copied to clipboard!" });
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background overflow-hidden touch-manipulation">
      <Navbar />
      
      <main className="flex-1 flex flex-col items-center pt-8 pb-4 px-4 w-full max-w-lg mx-auto">
        <div className="flex items-center justify-between w-full mb-6">
          <h1 className="text-2xl font-bold font-display">{format(new Date(), 'MMMM d, yyyy')}</h1>
          <div className="text-sm font-semibold px-3 py-1 rounded-full bg-secondary text-secondary-foreground">
            {game.length} Letters
          </div>
        </div>

        {/* Question */}
        <div className="w-full mb-8 p-4 rounded-xl bg-card border border-card-border">
          <p className="text-center text-lg font-semibold text-foreground">{game.question}</p>
        </div>

        {/* Game Grid */}
        <div className="flex-1 w-full flex flex-col items-center justify-center min-h-[300px]">
          <div className="grid gap-1.5 sm:gap-2" style={{ gridTemplateRows: `repeat(${MAX_GUESSES}, 1fr)` }}>
            {Array.from({ length: MAX_GUESSES }).map((_, rowIndex) => {
              const isCurrentRow = rowIndex === currentRowIndex;
              const isPastRow = rowIndex < currentRowIndex;
              const guess = isPastRow ? previousGuesses[rowIndex] : isCurrentRow ? currentGuess : "";
              const evalRow = isPastRow ? evaluations[rowIndex] : null;

              return (
                <div key={rowIndex} className="grid gap-1.5 sm:gap-2" style={{ gridTemplateColumns: `repeat(${game.length}, 1fr)` }}>
                  {Array.from({ length: game.length }).map((_, colIndex) => {
                    const letter = guess[colIndex] || "";
                    const evaluation = evalRow ? evalRow[colIndex] : null;
                    
                    let cellState = "game-cell-empty";
                    if (evaluation === 'correct') cellState = "game-cell-correct";
                    else if (evaluation === 'present') cellState = "game-cell-present";
                    else if (evaluation === 'absent') cellState = "game-cell-absent";
                    else if (letter) cellState = "game-cell-filled";

                    return (
                      <motion.div
                        key={`${rowIndex}-${colIndex}`}
                        initial={false}
                        animate={isPastRow ? { rotateX: [0, 90, 0] } : letter ? { scale: [1, 1.1, 1] } : {}}
                        transition={{ 
                          duration: isPastRow ? 0.6 : 0.15,
                          delay: isPastRow && !isGameOver ? colIndex * 0.1 : 0 // stagger flip
                        }}
                        className={`game-cell ${cellState}`}
                      >
                        {letter}
                      </motion.div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Keyboard Area */}
        <div className="w-full mt-auto mb-2">
          <Keyboard onKeyPress={onKeyPress} letterStatuses={letterStatuses} />
        </div>
      </main>

      {/* Win Dialog */}
      <Dialog open={showWinDialog} onOpenChange={setShowWinDialog}>
        <DialogContent className="sm:max-w-md text-center rounded-3xl border-0 shadow-2xl glass-panel">
          <div className="mx-auto w-16 h-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-4">
            <Trophy className="w-8 h-8" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-3xl font-display font-bold mb-2">Spectacular!</DialogTitle>
            <DialogDescription className="text-lg">
              You guessed the athlete in {previousGuesses.length} {previousGuesses.length === 1 ? 'try' : 'tries'}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 flex justify-center gap-2">
            {evaluations.map((row, i) => (
              <div key={i} className="flex flex-col gap-1">
                {row.map((ev, j) => (
                  <div 
                    key={j} 
                    className={`w-4 h-4 rounded-sm ${ev === 'correct' ? 'bg-[hsl(var(--correct))]' : ev === 'present' ? 'bg-[hsl(var(--present))]' : 'bg-[hsl(var(--absent))]'}`}
                  />
                ))}
              </div>
            ))}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button onClick={handleShare} className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 rounded-xl text-lg shadow-lg shadow-primary/25">
              <Share2 className="mr-2 w-5 h-5" /> Share Result
            </Button>
            <Button variant="outline" onClick={() => setLocation("/profile")} className="w-full h-12 rounded-xl text-lg font-bold">
              <BarChart2 className="mr-2 w-5 h-5" /> View Stats
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lose Dialog */}
      <Dialog open={showLoseDialog} onOpenChange={setShowLoseDialog}>
        <DialogContent className="sm:max-w-md text-center rounded-3xl border-0 shadow-2xl glass-panel">
           <div className="mx-auto w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-3xl font-display font-bold mb-2">Out of Tries</DialogTitle>
            <DialogDescription className="text-lg">
              The correct answer was <strong className="text-foreground text-xl block mt-2">{game.question}</strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2 mt-6">
            <Button onClick={handleShare} className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 rounded-xl text-lg shadow-lg shadow-primary/25">
              <Share2 className="mr-2 w-5 h-5" /> Share Attempt
            </Button>
            <Button variant="outline" onClick={() => setLocation("/profile")} className="w-full h-12 rounded-xl text-lg font-bold">
              <BarChart2 className="mr-2 w-5 h-5" /> View Stats
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
