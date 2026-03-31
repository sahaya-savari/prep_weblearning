import React, { useState } from "react";
import { Github, Mail } from "lucide-react";
import { Button } from "./ui/button";
import { useGithubSync } from "@/hooks/useGithubSync";

interface ShareActionsProps {
  content: string;
  filename: string;
  subject: string;
}

export function ShareActions({ content, filename, subject }: ShareActionsProps) {
  const { pushToGithub, hasGithubToken, syncing } = useGithubSync();
  const [githubSuccess, setGithubSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleEmail = () => {
    // Generate a mailto link properly escaping newlines and spaces
    const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(content)}`;
    window.location.href = mailto;
  };

  const handleGithub = async () => {
    try {
      setError("");
      await pushToGithub(content, filename);
      setGithubSuccess(true);
      setTimeout(() => setGithubSuccess(false), 3000);
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-border/50 mt-4">
        <Button 
          size="sm" 
          variant="outline" 
          onClick={handleEmail} 
          className="gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary/50"
        >
          <Mail className="h-4 w-4" /> Share via Email
        </Button>
        
        {hasGithubToken && (
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleGithub} 
            disabled={syncing || githubSuccess} 
            className="gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary/50"
          >
            <Github className="h-4 w-4" /> 
            {syncing ? "Pushing..." : githubSuccess ? "Pushed successfully!" : "Push to GitHub repo"}
          </Button>
        )}
      </div>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}
