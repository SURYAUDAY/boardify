%-------------------------
% Resume in Latex
% Author : Jake Gutierrez
% Based off of: https://github.com/sb2nov/resume
% License : MIT
%------------------------

\documentclass[letterpaper,10pt]{article}

\usepackage{latexsym}
\usepackage[empty]{fullpage}
\usepackage{titlesec}
\usepackage{marvosym}
\usepackage[usenames,dvipsnames]{color}
\usepackage{verbatim}
\usepackage{enumitem}
\usepackage[hidelinks]{hyperref}
\usepackage{fancyhdr}
\usepackage[english]{babel}
\usepackage{tabularx}
\usepackage{fontawesome5}
\usepackage{multicol}
\setlength{\multicolsep}{-3.0pt}
\setlength{\columnsep}{-1pt}
\input{glyphtounicode}

\pagestyle{fancy}
\fancyhf{}
\fancyfoot{}
\renewcommand{\headrulewidth}{0pt}
\renewcommand{\footrulewidth}{0pt}

% Adjust margins
\addtolength{\oddsidemargin}{-0.6in}
\addtolength{\evensidemargin}{-0.5in}
\addtolength{\textwidth}{1.19in}
\addtolength{\topmargin}{-.7in}
\addtolength{\textheight}{1.4in}

\urlstyle{same}
\raggedbottom
\raggedright
\setlength{\tabcolsep}{0in}

% Sections formatting
\titleformat{\section}{
  \vspace{-4pt}\scshape\raggedright\large\bfseries
}{}{0em}{}[\color{black}\titlerule \vspace{-4pt}]

\pdfgentounicode=1

%-------------------------
% Custom commands
\newcommand{\resumeItem}[1]{
  \item\small{
    {#1 \vspace{-2pt}}
  }
}

\newcommand{\resumeSubheading}[4]{
  \vspace{-2pt}\item
    \begin{tabular*}{1.0\textwidth}[t]{l@{\extracolsep{\fill}}r}
      \textbf{#1} & \textbf{\small #2} \\
      \textit{\small#3} & \textit{\small #4} \\
    \end{tabular*}\vspace{-7pt}
}

\newcommand{\resumeProjectHeading}[2]{
    \item
    \begin{tabular*}{1.001\textwidth}{l@{\extracolsep{\fill}}r}
      \small#1 & \textbf{\small #2}\\
    \end{tabular*}\vspace{-7pt}
}

\newcommand{\resumeSubItem}[1]{\resumeItem{#1}\vspace{-4pt}}

\renewcommand\labelitemi{$\vcenter{\hbox{\tiny$\bullet$}}$}
\renewcommand\labelitemii{$\vcenter{\hbox{\tiny$\bullet$}}$}

\newcommand{\resumeSubHeadingListStart}{\begin{itemize}[leftmargin=0.0in, label={}]}
\newcommand{\resumeSubHeadingListEnd}{\end{itemize}}
\newcommand{\resumeItemListStart}{\begin{itemize}}
\newcommand{\resumeItemListEnd}{\end{itemize}\vspace{-5pt}}

%-------------------------------------------
%%%%%%  RESUME STARTS HERE  %%%%%%%%%%%%%%%%%%%%%%%%%%%%

\begin{document}

%----------HEADING----------
\begin{center}
    {\Huge \scshape Suryauday Prakash Mishra} \\ \vspace{3pt}
    {\large Frontend Engineer} \\ \vspace{2pt}
    Vadodara, India \\ \vspace{1pt}
    \small \faPhone\ +91 7990138043 ~
    \href{mailto:suryauday245@gmail.com}{\faEnvelope\ \underline{suryauday245@gmail.com}} ~
    \href{https://linkedin.com/in/suryauday45}{\faLinkedin\ \underline{linkedin.com/in/suryauday45}} \\ \vspace{2pt}
    \href{https://suryauday-portfolio.netlify.app/}{\faGlobe\ \underline{suryauday-portfolio.netlify.app}} ~
    \href{https://github.com/SURYAUDAY}{\faGithub\ \underline{github.com/SURYAUDAY}}
\end{center}

%-----------SUMMARY-----------
\section{Summary}
Frontend Engineer with 3 years of experience building production-grade React and Next.js applications for B2B SaaS platforms. Specialised in architecting data-dense interfaces, multi-role workflows, and high-performance dashboards. Shipped a 50+ component design system (30\% faster delivery), reduced dashboard Time-to-Interactive from 20s to 3s (85\% faster), and architected virtualised tables rendering 30,000+ records with zero scroll lag. Strong on React internals, TypeScript, performance optimisation, accessibility, and component-driven development.

%-----------TECHNICAL SKILLS-----------
\section{Technical Skills}
 \begin{itemize}[leftmargin=0.15in, label={}]
    \small{\item{
     \textbf{Languages}{: JavaScript (ES2022+), TypeScript, HTML5, CSS3} \\
     \textbf{Frontend}{: React.js, Next.js (App Router), Redux Toolkit, React Query (TanStack Query), React Hook Form, React Router, Tailwind CSS, Material-UI, CSS Modules} \\
     \textbf{Performance \& UX}{: Core Web Vitals, Lighthouse, code splitting, lazy loading, virtualisation (react-window / TanStack Virtual), memoisation, responsive design, WCAG / ARIA accessibility} \\
     \textbf{Testing \& Tooling}{: Jest, React Testing Library, Storybook, Vite, Webpack, Postman} \\
     \textbf{Backend \& APIs}{: Node.js, Express.js, REST, Axios, JWT, RBAC, PostgreSQL, MongoDB, MySQL} \\
     \textbf{DevOps \& Monitoring}{: Git, GitHub, Vercel, Netlify, Sentry, LogRocket, Agile / Scrum}
    }}
 \end{itemize}

%-----------EXPERIENCE-----------
\section{Experience}
  \resumeSubHeadingListStart

    \resumeSubheading
      {Frontend Engineer}{Aug 2023 -- Present}
      {Eliteware Solutions}{Vadodara, India}
      \resumeItemListStart
        \resumeItem{\textbf{Owned end-to-end frontend delivery} of core platform features as hands-on tech lead --- JWT authentication with refresh-token rotation, multi-tenant company onboarding, and \textbf{Scope 1/2/3 carbon emission analytics dashboards} visualising emission trends, intensity metrics, and reduction targets across organisational hierarchies.}
        \resumeItem{Built a \textbf{50+ component design system} on top of MUI with TypeScript-typed props and Storybook documentation, cutting feature delivery time by \textbf{30\%}; achieved \textbf{80\%+ test coverage} with Jest and React Testing Library.}
        \resumeItem{\textbf{Cut dashboard Time-to-Interactive from 20s to 3s (85\% faster)} by auditing React Query cache key strategies across 40 hooks, refactoring \texttt{useState+useEffect} derived-state chains into \texttt{useMemo} selectors, and eliminating redundant client API calls (\textbf{44 to 12}); paired with backend query batching that collapsed 132 DB queries to 1.}
        \resumeItem{Architected \textbf{virtualised data tables rendering 10,000--30,000+ records} with zero scroll lag using row windowing, memoised cell components, and column-level lazy rendering; layered \textbf{JWT-based RBAC} across 4 user tiers (Admin, Data Contributor, Data Reviewer, Auditor) with route- and component-level guards.}
        \resumeItem{Improved \textbf{accessibility} across contributor and reviewer workflows --- keyboard navigation, ARIA labelling, and focus management for modals and drawers used across all 4 role types.}
        \resumeItem{Standardised the API layer with \textbf{Axios interceptors} and exponential-backoff retry; integrated \textbf{Sentry and LogRocket} for client-side observability --- surfacing \textbf{8--10 silent production bugs} and cutting debug time from hours to under 30 minutes.}
        \resumeItem{\textbf{Mentored 2 junior developers} and coordinated a 6-member feature team; introduced PR templates that cut review cycles from 3 rounds to 1, and drove sprint planning, ticket breakdown, and standups as tech lead.}
      \resumeItemListEnd

    \resumeSubheading
      {Web Developer}{Dec 2022 -- Apr 2023}
      {Edukite Learning}{Vadodara, India}
      \resumeItemListStart
        \resumeItem{Built a \textbf{responsive MCQ interface} supporting text and image-based questions, optimised across desktop, tablet, and mobile viewports.}
        \resumeItem{Developed a \textbf{post-submission analytics dashboard} with test results and performance breakdowns; resolved cross-browser UI bugs and rendering inconsistencies.}
      \resumeItemListEnd

  \resumeSubHeadingListEnd

%-----------PROJECTS-----------
\section{Projects}
    \resumeSubHeadingListStart

      \resumeProjectHeading
          {\textbf{FinTrack --- SaaS Finance Analytics Dashboard} $|$ \emph{Next.js 14, TypeScript, Prisma, PostgreSQL, OpenAI API} $|$ \href{<fintrack-live-url>}{\underline{Live}} $|$ \href{<fintrack-github-url>}{\underline{Code}}}{}
          \resumeItemListStart
            \resumeItem{Built a full-stack SaaS finance dashboard with \textbf{Next.js 14 App Router}, React Server Components, Prisma + PostgreSQL, and NextAuth v5 featuring \textbf{3-tier RBAC} across 15+ route groups.}
            \resumeItem{Implemented a \textbf{virtualised TanStack Table} rendering 500+ transactions with date filtering, server-side pagination, and column sorting; built \textbf{Recharts} dashboards for real-time MRR, revenue, and churn metrics.}
            \resumeItem{Engineered an \textbf{AI layer (GPT-4o-mini)} for natural-language financial queries, anomaly detection, and automated report generation --- dashboard APIs under \textbf{500ms} and \textbf{Lighthouse 88+} on Vercel.}
          \resumeItemListEnd

      \resumeProjectHeading
          {\textbf{Boardify --- Real-Time Collaborative Whiteboard} $|$ \emph{React, TypeScript, Node.js, Socket.io, MongoDB, OpenAI API} $|$ \href{https://boardify-xi.vercel.app/}{\underline{Live}} $|$ \href{https://github.com/SURYAUDAY/boardify}{\underline{Code}}}{}
          \resumeItemListStart
            \resumeItem{Built a real-time multi-user whiteboard on the \textbf{MERN + TypeScript} stack with \textbf{Socket.io rooms} broadcasting strokes, cursors (throttled to 50ms), and sticky-note edits under \textbf{100ms}; engineered HTML5 Canvas drawing with quadratic B\'ezier smoothing, \textbf{DPR-aware retina rendering}, and 10 tools (pen / shapes / text / eraser / select / sticky / pan / zoom).}
            \resumeItem{Implemented \textbf{JWT auth} with bcrypt hashing, owner/editor/viewer \textbf{RBAC} with disabled-toolbar view-only mode, and public share-link modes (view/edit/none); built a 50-step \textbf{undo/redo stack} with deep cloning, 2s-debounced autosave, and PNG/JSON export via offscreen canvas rendering.}
            \resumeItem{Integrated 4 \textbf{GPT-4o / 4o-mini} features --- prompt-to-diagram (JSON shapes + arrows with batched undo via generation IDs), board summarisation, sticky-note theme clustering, and \textbf{handwriting OCR} via vision API; covered by \textbf{91 automated tests} (Supertest with mongodb-memory-server + Vitest with React Testing Library), deployed on Vercel + Render with MongoDB Atlas.}
          \resumeItemListEnd

    \resumeSubHeadingListEnd

%-----------EDUCATION-----------
\section{Education}
  \resumeSubHeadingListStart
    \resumeSubheading
      {Master of Computer Applications (MCA)}{2021 -- 2023}
      {Sardar Patel University}{Vadodara, India}
    \resumeSubheading
      {Bachelor of Computer Applications (BCA)}{2018 -- 2021}
      {Maharaja Sayajirao University}{Vadodara, India}
  \resumeSubHeadingListEnd

\end{document}