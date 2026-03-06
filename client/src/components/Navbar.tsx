import { Link, useLocation } from "wouter";
import { Trophy, User, LogOut, Settings, Play } from "lucide-react";
import { useAuth, useLogout } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function Navbar() {
  const { data: user } = useAuth();
  const logout = useLogout();
  const [_, setLocation] = useLocation();

  const handleLogout = async () => {
    await logout.mutateAsync();
    setLocation("/");
  };

  return (
    <nav className="sticky top-0 z-50 w-full glass-panel border-b-0 border-t-0 border-l-0 border-r-0 rounded-none shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-2 group outline-none">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-blue-400 flex items-center justify-center text-white shadow-lg shadow-primary/25 group-hover:scale-105 transition-transform duration-300">
              <Trophy className="w-5 h-5" />
            </div>
            <span className="font-display font-bold text-xl tracking-tight hidden sm:block">
              Athletics<span className="text-primary">Daily</span>
            </span>
          </Link>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link href="/game" className="hidden sm:inline-flex">
                  <Button variant="ghost" className="font-semibold gap-2">
                    <Play className="w-4 h-4" /> Play
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10 border-2 border-primary/20 hover:border-primary/50 transition-colors">
                        <AvatarFallback className="bg-primary/10 text-primary font-display font-bold">
                          {user.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{user.username}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/game" className="cursor-pointer flex w-full items-center">
                        <Play className="mr-2 h-4 w-4" />
                        <span>Play Game</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer flex w-full items-center">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile & Stats</span>
                      </Link>
                    </DropdownMenuItem>
                    {user.isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="cursor-pointer flex w-full items-center">
                          <Settings className="mr-2 h-4 w-4" />
                          <span>Admin Dashboard</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive cursor-pointer"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex gap-2">
                <Link href="/auth">
                  <Button variant="ghost" className="font-semibold">Login</Button>
                </Link>
                <Link href="/auth">
                  <Button className="font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
