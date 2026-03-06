import { Link } from "wouter";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Trophy, Medal, Star, ChevronRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-1/4 left-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl -translate-x-1/2" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl translate-x-1/3" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 py-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm font-semibold mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Star className="w-4 h-4 text-yellow-500" />
            <span>The Daily Athletics Challenge</span>
          </div>
          
          <h1 className="text-5xl sm:text-7xl font-display font-extrabold tracking-tight mb-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
            Guess the <span className="text-primary relative whitespace-nowrap">
              Athlete
              <svg className="absolute -bottom-2 left-0 w-full h-3 text-primary/30" viewBox="0 0 100 12" preserveAspectRatio="none">
                <path d="M0,10 Q50,0 100,10" stroke="currentColor" strokeWidth="4" fill="none" />
              </svg>
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 leading-relaxed">
            Test your track and field knowledge. Six tries to guess the legendary athlete, historical venue, or iconic event. A new puzzle awaits every single day.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
            <Link href="/game" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto text-lg h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-1 transition-all duration-300 font-bold group">
                Start Game <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/auth" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg h-14 px-8 rounded-2xl border-2 hover:bg-secondary transition-all duration-300 font-bold">
                Create Account
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="max-w-6xl mx-auto px-4 w-full grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12 pb-20 animate-in fade-in slide-in-from-bottom-12 duration-700 delay-500">
          <div className="glass-panel p-6 rounded-3xl flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center mb-4">
              <Trophy className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold font-display mb-2">Daily Puzzles</h3>
            <p className="text-muted-foreground text-sm">A new athletics-themed challenge is posted every midnight.</p>
          </div>
          <div className="glass-panel p-6 rounded-3xl flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
              <Medal className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold font-display mb-2">Track Stats</h3>
            <p className="text-muted-foreground text-sm">Build your streak, compare win rates, and show off your knowledge.</p>
          </div>
          <div className="glass-panel p-6 rounded-3xl flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center mb-4">
              <Star className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold font-display mb-2">Adaptive Grid</h3>
            <p className="text-muted-foreground text-sm">Puzzles range from 5 to 7 letters. Be ready for any champion!</p>
          </div>
        </div>
      </main>
    </div>
  );
}
