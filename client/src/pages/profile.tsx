import { useLocation } from "wouter";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useGameStats } from "@/hooks/use-game";
import { Navbar } from "@/components/Navbar";
import { Loader2, TrendingUp, Trophy, Target, Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function Profile() {
  const [_, setLocation] = useLocation();
  const { data: user, isLoading: authLoading } = useAuth();
  const { data: stats, isLoading: statsLoading } = useGameStats();

  useEffect(() => {
    if (!authLoading && !user) {
      setLocation("/auth");
    }
  }, [user, authLoading, setLocation]);

  if (authLoading || statsLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!user || !stats) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-12">
        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-4xl sm:text-5xl font-display font-bold tracking-tight text-foreground">
            Athlete Profile
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Statistics and historical performance for <span className="font-bold text-foreground">{user.username}</span>.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 group-hover:opacity-30 transition-all">
              <Target className="w-16 h-16" />
            </div>
            <CardContent className="p-6 relative z-10">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Played</p>
              <p className="text-4xl font-display font-bold text-foreground">{stats.gamesPlayed}</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 text-green-500 opacity-20 group-hover:scale-110 group-hover:opacity-30 transition-all">
              <Trophy className="w-16 h-16" />
            </div>
            <CardContent className="p-6 relative z-10">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Win Rate</p>
              <p className="text-4xl font-display font-bold text-foreground">{Math.round(stats.winRate)}%</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 text-orange-500 opacity-20 group-hover:scale-110 group-hover:opacity-30 transition-all">
              <Flame className="w-16 h-16" />
            </div>
            <CardContent className="p-6 relative z-10">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Streak</p>
              <p className="text-4xl font-display font-bold text-foreground">{stats.currentStreak}</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg bg-gradient-to-br from-card to-card/50 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 text-primary opacity-20 group-hover:scale-110 group-hover:opacity-30 transition-all">
              <TrendingUp className="w-16 h-16" />
            </div>
            <CardContent className="p-6 relative z-10">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Best Guess</p>
              <p className="text-4xl font-display font-bold text-foreground">{stats.bestAttempt || '-'}</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
