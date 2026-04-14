"""
github_service.py — Integration with GitHub for automated PRs.

Uses PyGithub to checkout a branch, commit code, and open PRs.
"""

import os
import time
from typing import Optional, Tuple
from github import Github
from github.GithubException import GithubException

def get_github_client() -> Optional[Github]:
    """Returns an authenticated Github client, or None if not configured."""
    token = os.getenv("GITHUB_ACCESS_TOKEN")
    if not token or token == "your-github-personal-access-token":
        return None
    return Github(token)

def create_fix_pr(
    require_path: str,
    patched_code: str,
    commit_msg: str,
    pr_title: str,
    pr_body: str
) -> Tuple[bool, str]:
    """
    Creates a new branch, commits the patched code, and opens a PR.
    Returns (success_bool, pr_url_or_error_message).
    """
    gh = get_github_client()
    if not gh:
        return False, "GITHUB_ACCESS_TOKEN not configured."

    repo_name = os.getenv("GITHUB_REPO_NAME")
    if not repo_name or repo_name == "username/repo-name":
        return False, "GITHUB_REPO_NAME not configured."

    try:
        repo = gh.get_repo(repo_name)
        
        # 1. Get the default branch (usually 'main' or 'master')
        default_branch = repo.default_branch
        ref = repo.get_branch(default_branch)
        
        # 2. Create a unique branch name
        timestamp = int(time.time())
        new_branch_name = f"safee-fix-{timestamp}"
        
        # 3. Create the new branch reference
        repo.create_git_ref(ref=f"refs/heads/{new_branch_name}", sha=ref.commit.sha)
        
        # 4. Get the current file contents to update
        try:
            contents = repo.get_contents(require_path, ref=default_branch)
            # If it's a list, it means require_path is a directory
            if isinstance(contents, list):
                return False, f"Path {require_path} is a directory, not a file."
            
            # 5. Commit the new file contents to the new branch
            repo.update_file(
                path=contents.path,
                message=commit_msg,
                content=patched_code,
                sha=contents.sha,
                branch=new_branch_name
            )
            
        except GithubException as ge:
            if ge.status == 404:
                # File doesn't exist, create it instead of updating
                repo.create_file(
                    path=require_path,
                    message=commit_msg,
                    content=patched_code,
                    branch=new_branch_name
                )
            else:
                raise ge

        # 6. Create the Pull Request
        pr = repo.create_pull(
            title=pr_title,
            body=pr_body,
            head=new_branch_name,
            base=default_branch
        )
        
        return True, pr.html_url

    except Exception as e:
        return False, f"GitHub integration error: {str(e)}"
