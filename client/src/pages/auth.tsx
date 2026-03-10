import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useLogin, useRegister, useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Trophy, Loader2 } from "lucide-react";

export default function Auth() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  
  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const { data: user } = useAuth();

  useEffect(() => {
    if (user) {
      setLocation("/game");
    }
  }, [user, setLocation]);
  
  const [loginData, setLoginData] = useState({ username: "", password: "" });
  const [registerData, setRegisterData] = useState({ username: "", email: "", password: "" });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginMutation.mutateAsync(loginData);
      toast({ title: "Welcome back!", description: "Successfully logged in." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Login Failed", description: error.message });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerData.email.endsWith("@gmail.com")) {
      toast({
        variant: "destructive",
        title: "Invalid Email",
        description: "Please use a valid Gmail address (example@gmail.com)"
      });
      return;
    }
    try {
      await registerMutation.mutateAsync(registerData);
      toast({ title: "Account Created!", description: "Welcome to Athletics Daily." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Registration Failed", description: error.message });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-blue-400 items-center justify-center text-white shadow-xl shadow-primary/20 mb-6">
              <Trophy className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-display font-bold">Join the Game</h1>
            <p className="text-muted-foreground mt-2">Sign in to save your daily streaks and stats.</p>
          </div>

          <div className="glass-panel p-1 rounded-3xl shadow-2xl">
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4 bg-transparent p-1">
                <TabsTrigger value="login" className="rounded-2xl py-3 font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg">
                  Login
                </TabsTrigger>
                <TabsTrigger value="register" className="rounded-2xl py-3 font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg">
                  Register
                </TabsTrigger>
              </TabsList>
              
              <div className="p-5 pt-0">
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-username">Username</Label>
                      <Input 
                        id="login-username" 
                        value={loginData.username}
                        onChange={e => setLoginData({...loginData, username: e.target.value})}
                        className="h-12 rounded-xl bg-secondary/50 border-transparent focus:border-primary focus:ring-primary/20"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input 
                        id="login-password" 
                        type="password"
                        value={loginData.password}
                        onChange={e => setLoginData({...loginData, password: e.target.value})}
                        className="h-12 rounded-xl bg-secondary/50 border-transparent focus:border-primary focus:ring-primary/20"
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 font-bold mt-2"
                      disabled={loginMutation.isPending}
                    >
                      {loginMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="reg-username">Username</Label>
                      <Input 
                        id="reg-username" 
                        value={registerData.username}
                        onChange={e => setRegisterData({...registerData, username: e.target.value})}
                        className="h-12 rounded-xl bg-secondary/50 border-transparent focus:border-primary focus:ring-primary/20"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-email">Email</Label>
                      <Input 
                        id="reg-email" 
                        type="email"
                        value={registerData.email}
                        onChange={e => setRegisterData({...registerData, email: e.target.value})}
                        className="h-12 rounded-xl bg-secondary/50 border-transparent focus:border-primary focus:ring-primary/20"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-password">Password</Label>
                      <Input 
                        id="reg-password" 
                        type="password"
                        value={registerData.password}
                        onChange={e => setRegisterData({...registerData, password: e.target.value})}
                        className="h-12 rounded-xl bg-secondary/50 border-transparent focus:border-primary focus:ring-primary/20"
                        required
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 font-bold mt-2"
                      disabled={registerMutation.isPending}
                    >
                      {registerMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
                    </Button>
                  </form>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}
