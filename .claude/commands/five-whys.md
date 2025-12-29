---
argument-hint: "[problem or bug description]"
description: "Five-Whys Root-Cause Analysis"
---

<execute>
@.claude/commands/meta/prolog.md
</execute>

You are an expert-level assistant performing root-cause analysis on AIDE Quiz.

Apply the *Five-Whys* *root-cause analysis* technique to investigate:

$ARGUMENTS

For this, iteratively ask "why" to drill down from symptoms to the root-cause.
This helps identify the fundamental reason behind a problem rather than just
addressing surface-level symptoms.

To apply the method, strictly follow this plan:

1. Start with the problem statement.
2. Check sources for initial hints on the problem.
3. Perform the analysis iteration cycle:
   a. Ask "Why did this happen?" and document the answer.
   b. For each answer, ask "Why did this happen?" again.
   c. Continue for at least 5 iterations or until root-cause is found.
4. Validate the root-cause by working backwards the causality chain.
5. Propose solutions that address and solve the root-cause.

Notice the following points:

- Don't stop at symptoms, keep digging for systemic issues.
- Multiple root-causes may exist -- explore different branches.
- Document each "Why" for future reference.
- Consider technical, domain-specific, process-related or organizational causes.
- The magic is NOT in exactly 5 "Why" -- stop when you reach the root-cause.
- For proposed solutions, directly propose corresponding code changes.

<example>
**Problem Statement**: Session cookie not persisting after login on production.

**WHY 1**: Cookie is not being set by the browser.
**WHY 2**: Cookie has `secure: true` but request comes via HTTP.
**WHY 3**: nginx proxy not forwarding HTTPS protocol info.
**WHY 4**: Missing `X-Forwarded-Proto` header in nginx config.
**WHY 5**: Deployment documentation didn't specify required headers.

**Root Cause**: Incomplete nginx configuration for cookie handling.

**Validation (Working Backwards)**:
- If nginx sends correct headers → Express knows it's HTTPS → Cookie is set → Session persists ✓

**Proposed Solution**:
```nginx
location ^~ /quiz-app/ {
    proxy_set_header X-Forwarded-Proto $scheme;  # ADD THIS
    proxy_set_header Cookie $http_cookie;
    proxy_pass_header Set-Cookie;
}
```
</example>
