# Prism + Crixet Feature Teardown Matrix (v1)

Date: 2026-02-10  
Legend: `Verified` = explicitly documented/public; `Inferred` = high-confidence architectural inference; `Unknown` = not publicly confirmed.

| Domain | Prism (OpenAI) | Crixet | Confidence |
|---|---|---|---|
| Product positioning | AI-native scientific writing/LaTeX workspace | AI-assisted LaTeX editor/workspace | Verified |
| Core UX pattern | Editor + AI assistance with non-chat-only workflow | Code + preview with AI assistant and collaboration docs | Verified |
| Compile model | Cloud compile/runtime implied, not fully public | LaTeX compile with logs/tutorial support | Verified |
| LaTeX engine internals | Not publicly specified in full detail | Not publicly specified in full detail | Unknown |
| Collaboration substrate (OT/CRDT details) | Not publicly specified | Not publicly specified | Unknown |
| AI model runtime | Prism publicly tied to OpenAI model stack | Crixet exposes AI assistant workflows, provider internals not fully public | Verified/Unknown split |
| Project migration/import | Supported workflow implied | Explicit migration tutorials | Verified |
| Shortcut-first editing | Likely for power workflows | Explicit shortcut tutorials | Verified |
| Comment/review workflow | Included in experience | Explicit collaboration/comment tutorials | Verified |
| Security architecture | Not fully public | Not fully public | Unknown |

## Verified Sources

1. OpenAI Prism page: https://openai.com/prism  
2. OpenAI release notes/help tracking: https://help.openai.com/en/articles/6825453-chatgpt-release-notes  
3. OpenAI blog: https://openai.com/index/introducing-prism
3. Crixet tutorial hub: https://crixet.com/resources/tutorials  
4. Crixet article set (lessons, migration, AI assistant, comments, collaboration):  
   - https://crixet.com/articles/latex-tutorial-lesson-1  
   - https://crixet.com/articles/latex-tutorial-lesson-2  
   - https://crixet.com/articles/latex-tutorial-lesson-3  
   - https://crixet.com/articles/latex-tutorial-lesson-4  
   - https://crixet.com/articles/latex-tutorial-lesson-5  
   - https://crixet.com/articles/latex-tutorial-for-beginners-5-lessons-from-basics-to-intermediate  
   - https://crixet.com/articles/moving-latex-code-to-subfiles  
   - https://crixet.com/articles/moving-between-latex-code-and-preview  
   - https://crixet.com/articles/moving-latex-projects-to-crixet  
   - https://crixet.com/articles/crixet-latex-keyboard-shortcuts  
   - https://crixet.com/articles/crixet-latex-ai-assistant  
   - https://crixet.com/articles/comment-on-latex-project  
   - https://crixet.com/articles/collaborate-on-latex-project

## Unknowns We Must Not Pretend To Know

1. Prism/Crixet exact orchestration internals for compile queues.
2. Exact sync protocol implementation and conflict-resolution internals.
3. Exact sandboxing implementation (container seccomp profile, process isolation, cache model).
