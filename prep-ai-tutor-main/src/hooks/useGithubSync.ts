import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export function useGithubSync() {
  const { githubToken } = useAuth();
  const [syncing, setSyncing] = useState(false);

  // Encode safe base64 for UTF-8 markdown strings
  const encodeBase64 = (str: string) => {
    return btoa(
      encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) =>
        String.fromCharCode(parseInt(p1, 16))
      )
    );
  };

  const pushToGithub = async (content: string, filename: string) => {
    if (!githubToken) {
      throw new Error("GitHub not connected. Please login with GitHub to enable this feature.");
    }

    setSyncing(true);
    try {
      // 1. Get exact GitHub username
      const usernameRes = await fetch("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${githubToken}` },
      });
      if (!usernameRes.ok) throw new Error("Invalid GitHub token");
      const userObj = await usernameRes.json();
      const owner = userObj.login;

      const repo = "prepmind-learning";
      
      // 2. Check if repo exists
      const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: { Authorization: `Bearer ${githubToken}` },
      });

      if (repoRes.status === 404) {
        // Create private repo on the fly
        const createRes = await fetch("https://api.github.com/user/repos", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${githubToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: repo,
            description: "My personal learning notes from PrepMind AI",
            private: true,
            auto_init: true,
          }),
        });
        if (!createRes.ok) throw new Error("Failed to create GitHub repository");
      }

      // 3. Check if file already exists to get its SHA (required for update)
      const fileRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${filename}`,
        { headers: { Authorization: `Bearer ${githubToken}` } }
      );
      
      let sha;
      if (fileRes.ok) {
        const fileData = await fileRes.json();
        sha = fileData.sha;
      }

      // 4. Commit file
      const b64encoded = encodeBase64(content);
      const commitRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${filename}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${githubToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: `Update ${filename} via PrepMind AI`,
            content: b64encoded,
            sha,
          }),
        }
      );

      if (!commitRes.ok) {
        throw new Error("Failed to commit file to GitHub");
      }
    } finally {
      setSyncing(false);
    }
  };

  return { pushToGithub, syncing, hasGithubToken: !!githubToken };
}
