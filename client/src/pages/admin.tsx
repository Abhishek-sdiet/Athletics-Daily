import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { format, parseISO } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useAdminQuestions, useUploadWeek, useDeleteQuestion } from "@/hooks/use-admin";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trash2, Calendar, Database, Upload, AlertCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Admin() {
  const [_, setLocation] = useLocation();
  const { data: user, isLoading: authLoading } = useAuth();
  const { data: questions, isLoading: questionsLoading } = useAdminQuestions();
  const uploadMutation = useUploadWeek();
  const deleteMutation = useDeleteQuestion();
  const { toast } = useToast();

  const [jsonInput, setJsonInput] = useState("");

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        setLocation("/auth");
      } else if (!user.isAdmin) {
        setLocation("/");
        toast({ title: "Unauthorized", description: "Admin access required.", variant: "destructive" });
      }
    }
  }, [user, authLoading, setLocation, toast]);

  if (authLoading || questionsLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!user?.isAdmin) return null;

  const handleUpload = async () => {
    try {
      const parsed = JSON.parse(jsonInput);
      if (!Array.isArray(parsed)) throw new Error("Input must be a JSON array");
      
      await uploadMutation.mutateAsync(parsed);
      toast({ title: "Success", description: "Questions uploaded successfully." });
      setJsonInput("");
    } catch (e: any) {
      toast({ title: "Invalid Data", description: e.message, variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this puzzle?")) {
      try {
        await deleteMutation.mutateAsync(id);
        toast({ title: "Deleted", description: "Question removed." });
      } catch (e: any) {
        toast({ title: "Error", description: e.message, variant: "destructive" });
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage daily puzzles and uploads.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <Upload className="w-5 h-5 text-primary" />
                  Bulk Upload JSON
                </CardTitle>
                <CardDescription>
                  Format: <code>[{`{"questionText": "BOLT", "answer": "BOLT", "date": "2024-03-06"}`}]</code>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea 
                  value={jsonInput}
                  onChange={e => setJsonInput(e.target.value)}
                  placeholder="Paste JSON array here..."
                  className="min-h-[250px] font-mono text-sm bg-secondary/50 border-transparent rounded-xl focus:border-primary focus:ring-primary/20 resize-y mb-4"
                />
                <Button 
                  onClick={handleUpload} 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-md h-12 rounded-xl"
                  disabled={uploadMutation.isPending || !jsonInput.trim()}
                >
                  {uploadMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Upload className="w-5 h-5 mr-2" />}
                  Upload Puzzles
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Upcoming & Past Puzzles
                </CardTitle>
                <CardDescription>All loaded daily challenges.</CardDescription>
              </CardHeader>
              <CardContent>
                {questions && questions.length > 0 ? (
                  <div className="rounded-xl border border-border overflow-hidden">
                    <Table>
                      <TableHeader className="bg-secondary/50">
                        <TableRow>
                          <TableHead className="font-semibold text-foreground">Date</TableHead>
                          <TableHead className="font-semibold text-foreground">Answer</TableHead>
                          <TableHead className="font-semibold text-foreground">Length</TableHead>
                          <TableHead className="text-right font-semibold text-foreground">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {questions.map((q) => {
                          const isPast = new Date(q.date) < new Date(new Date().setHours(0,0,0,0));
                          return (
                            <TableRow key={q.id} className={isPast ? "opacity-60 bg-muted/30" : ""}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  {format(parseISO(q.date), 'MMM dd, yyyy')}
                                  {isPast && <Badge variant="secondary" className="text-[10px]">Past</Badge>}
                                </div>
                              </TableCell>
                              <TableCell className="font-bold tracking-wider font-display text-primary">{q.answer}</TableCell>
                              <TableCell>{q.answer.length}</TableCell>
                              <TableCell className="text-right">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors rounded-lg"
                                  onClick={() => handleDelete(q.id)}
                                  disabled={deleteMutation.isPending}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-12 flex flex-col items-center border-2 border-dashed border-border rounded-2xl">
                    <AlertCircle className="w-10 h-10 text-muted-foreground mb-3" />
                    <p className="text-muted-foreground font-medium">No puzzles loaded.</p>
                    <p className="text-sm text-muted-foreground mt-1">Use the upload tool to add the schedule.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
        </div>
      </main>
    </div>
  );
}
