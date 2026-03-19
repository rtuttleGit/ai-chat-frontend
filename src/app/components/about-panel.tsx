"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

type AboutPanelProps = {
  open: boolean;
  onClose: () => void;
};

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <div className="space-y-3 text-sm leading-7 text-gray-700">{children}</div>
    </section>
  );
}

export default function AboutPanel({ open, onClose }: AboutPanelProps) {
  const panelRef = useRef<HTMLElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    const previousActiveElement = document.activeElement as HTMLElement | null;

    document.body.style.overflow = "hidden";

    const focusFirstElement = () => {
      if (closeButtonRef.current) {
        closeButtonRef.current.focus();
        return;
      }

      const focusable = getFocusableElements();
      focusable[0]?.focus();
    };

    const getFocusableElements = () => {
      if (!panelRef.current) return [] as HTMLElement[];

      const selector = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])',
      ].join(",");

      return Array.from(panelRef.current.querySelectorAll<HTMLElement>(selector)).filter(
        (el) => !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true"
      );
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const focusable = getFocusableElements();
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (active === first || !panelRef.current?.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else {
        if (active === last || !panelRef.current?.contains(active)) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    requestAnimationFrame(() => {
      focusFirstElement();
    });

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      previousActiveElement?.focus?.();
    };
  }, [open, onClose]);

  return (
    <>
      <div
        className={`fixed inset-0 z-[60] bg-black/40 transition-opacity duration-300 ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden={!open}
      />

      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
        aria-label="About this chat application"
        className={`fixed right-0 top-0 z-[70] flex h-[100dvh] w-full max-w-3xl flex-col border-l border-gray-200 bg-gray-50 shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-semibold text-gray-900">
              About the Architecture
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              This demo was built to showcase AI engineering, full stack product engineering,
              and production-minded system design in one cohesive application.
            </p>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="ml-4 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
            aria-label="Close about panel"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
          <div className="space-y-5">
            <Section title="Purpose of This Demo">
              <p>
                This project is intentionally broader than a basic chat UI. It was designed as a
                portfolio-quality demonstration of how AI features can be built as real systems:
                with workflow orchestration, durable persistence, asynchronous background jobs,
                realtime UI updates, and containerized deployment.
              </p>

              <p>
                The goal is to show more than prompt-to-response integration. It demonstrates how
                to design an AI-backed product end to end: frontend UX, typed API boundaries,
                workflow composition, persistent chat state, job processing, infrastructure, and
                operational tooling.
              </p>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-950/80">
                This is an AI engineering demo, a full stack demo, and a deployment demo at the
                same time.
              </div>
            </Section>

            <Section title="System Diagram">
              <p>
                The application uses one shared backend chat workflow and exposes it through two
                frontend delivery patterns: direct synchronous responses and background processing
                with realtime updates.
              </p>

              <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-gray-900 p-4">
                <pre className="text-xs leading-6 text-gray-100">
{`User
  |
  v
Next.js Frontend
  |
  +--> Direct Response UI
  |      |
  |      v
  |   /api/chat/direct
  |      |
  |      v
  |   FastAPI /chat/direct
  |      |
  |      v
  |   Chat workflow runs immediately
  |      |
  |      v
  |   JSON response returned
  |      |
  |      v
  |   Next.js simulates streaming to the UI
  |
  +--> Background + Realtime UI
         |
         v
      /api/chat/websocket
         |
         v
      FastAPI /chat/websocket
         |
         v
      Event row created + Celery job queued
         |
         v
      Worker runs chat workflow
         |
         v
      chats table updated
         |
         v
      Supabase realtime update
         |
         v
      UI syncs from persisted history`}
                </pre>
              </div>

              <p>
                The route named <code>/chat/websocket</code> is not a native WebSocket server. It
                is an HTTP endpoint for asynchronous background processing. The realtime behavior in
                the browser comes from Supabase change subscriptions after the backend worker
                updates the persisted chat row.
              </p>
            </Section>

            <Section title="AI Engineering Highlights">
              <p>
                The backend is structured around a reusable workflow engine rather than a single
                monolithic chat handler. Chat generation is broken into discrete nodes that load
                prior state, call the model, and persist the updated transcript.
              </p>

              <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-gray-900 p-4">
                <pre className="text-xs leading-6 text-gray-100">
{`Chat Workflow
  |
  +--> PrepareChatNode
  |      - loads the current chat by id
  |      - reads pydantic-compatible message history
  |
  +--> ChatCompletionNode
  |      - rebuilds prior model messages
  |      - sends the latest user message to the LLM
  |      - captures assistant output and updated history
  |
  +--> UpdateChatNode
         - appends user + assistant messages
         - updates persisted message_history
         - updates model-facing history
         - saves the final assistant reply`}
                </pre>
              </div>

              <ul className="list-disc space-y-2 pl-5">
                <li>
                  The chat feature is modeled as a real workflow, not just a single API call.
                </li>
                <li>
                  The same core workflow can run synchronously or asynchronously without changing
                  the business logic.
                </li>
                <li>
                  The architecture separates model-facing history from UI-facing message history,
                  which is important in real AI products.
                </li>
                <li>
                  Background execution allows the system to scale beyond request-time constraints.
                </li>
              </ul>
            </Section>

            <Section title="Full Stack Engineering Highlights">
              <p>
                The frontend is not just a thin wrapper around an API. It manages responsive layout,
                shared app state, chat selection, race-proof synchronization, and two distinct
                interaction models for the same backend capability.
              </p>

              <ul className="list-disc space-y-2 pl-5">
                <li>
                  A shared React context stores the selected chat, loaded transcript, and responsive
                  shell state.
                </li>
                <li>
                  The sidebar creates chats, selects chats, and refreshes durable history from
                  Supabase.
                </li>
                <li>
                  Direct mode uses the AI SDK <code>useChat</code> hook for a fast conversational
                  request-response UX.
                </li>
                <li>
                  Background mode manages local state and listens to realtime database updates when
                  the worker finishes.
                </li>
                <li>
                  The UI supports mode switching without losing persistent conversation state.
                </li>
              </ul>

              <p>
                This demonstrates product engineering judgment: one shared data model, but
                different UX strategies depending on how work is delivered and observed.
              </p>
            </Section>

            <Section title="Chat Modes Comparison">
              <p>
                Both chat modes rely on the same persisted transcript and the same backend workflow.
                The difference is how much work happens inside the original request and how the UI
                receives the answer.
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                  <h3 className="mb-2 font-medium text-blue-900">
                    Direct Response
                  </h3>
                  <p className="text-sm leading-7 text-blue-950/80">
                    The workflow runs immediately and the final answer comes back in the same HTTP
                    request. The frontend then renders that completed response with a simulated
                    streaming effect for a more conversational UX.
                  </p>
                </div>

                <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
                  <h3 className="mb-2 font-medium text-green-900">
                    Background + Realtime
                  </h3>
                  <p className="text-sm leading-7 text-green-950/80">
                    The request queues work first, then a worker completes the workflow later. The
                    browser reacts to the finished result by subscribing to realtime updates on the
                    persisted chat record.
                  </p>
                </div>
              </div>
            </Section>

            <Section title="Direct Response vs Background Processing">
              <p>
                Direct mode is best for low-latency request-response interactions. Background mode
                is better when the app should acknowledge the request immediately and let work
                continue independently in the background.
              </p>

              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <strong>Direct response</strong> is easier to debug because one user action maps
                  cleanly to one request lifecycle.
                </li>
                <li>
                  <strong>Background processing</strong> is more resilient for longer-running or
                  bursty workloads because work is queued and handled by Celery.
                </li>
                <li>
                  <strong>Direct mode</strong> prioritizes immediate UX feedback.
                </li>
                <li>
                  <strong>Background mode</strong> prioritizes operational flexibility and async
                  delivery.
                </li>
                <li>
                  Both modes still converge on the same durable chat transcript in storage.
                </li>
              </ul>
            </Section>

            <Section title="State Management Strategy">
              <p>
                The frontend uses a split state model. Shared application state lives in a provider,
                while mode-specific interaction behavior lives inside each chat implementation.
              </p>

              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <strong>Shared context</strong> stores the selected chat id, the loaded persisted
                  message history, and shell state like mobile sidebar visibility.
                </li>
                <li>
                  <strong>The sidebar</strong> is responsible for chat list management, chat
                  creation, and refreshing the selected transcript from Supabase.
                </li>
                <li>
                  <strong>Direct mode</strong> uses <code>useChat</code> and re-syncs after
                  completion so rendered messages align with durable persistence.
                </li>
                <li>
                  <strong>Background mode</strong> manages local message state but rehydrates from
                  realtime database updates.
                </li>
                <li>
                  <strong>Persisted history</strong> acts as the cross-mode source of truth.
                </li>
              </ul>
            </Section>

            <Section title="Race Condition Handling">
              <p>
                This demo also highlights the kind of engineering details that matter in real
                products. The visible UI response can arrive before every part of the app has
                reloaded the final persisted transcript, especially when switching chats or modes.
              </p>

              <p>
                To handle that safely, the app treats the database-backed transcript as the durable
                source of truth and performs explicit refreshes during mode switches and after
                completion.
              </p>

              <ul className="list-disc space-y-2 pl-5">
                <li>
                  Selecting a chat triggers a fresh transcript fetch rather than relying only on
                  in-memory sidebar data.
                </li>
                <li>
                  Switching modes performs a race-proof refresh sequence before mounting the next
                  view.
                </li>
                <li>
                  That sequence fetches immediately, waits briefly, and fetches again to catch
                  delayed commits.
                </li>
                <li>
                  Direct mode performs a follow-up sync after completion.
                </li>
                <li>
                  Background mode ignores duplicate assistant updates to avoid replay artifacts.
                </li>
              </ul>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-950/80">
                Durable persisted state wins over temporary in-memory state.
              </div>
            </Section>

            <Section title="Infrastructure & Deployment">
              <p>
                The deployment story is part of the demo. The system is containerized and composed
                as a multi-service stack rather than being presented as a local-only prototype.
              </p>

              <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-gray-900 p-4">
                <pre className="text-xs leading-6 text-gray-100">
{`Docker Compose Stack
  |
  +--> frontend
  +--> api
  +--> celery_worker
  +--> redis
  +--> db
  +--> caddy
  |
  +--> Supabase services
         - kong
         - auth
         - rest
         - realtime
         - storage
         - studio
         - analytics
         - pooler
         - meta
         - functions`}
                </pre>
              </div>

              <ul className="list-disc space-y-2 pl-5">
                <li>
                  The Compose setup splits the app into dedicated frontend, API, worker, Redis,
                  Postgres, and reverse proxy services.
                </li>
                <li>
                  The stack also includes self-hosted Supabase components for REST, auth, storage,
                  analytics, and realtime capabilities.
                </li>
                <li>
                  The root Compose file includes both the application stack and the Supabase stack,
                  which makes the environment reproducible as one system.
                </li>
                <li>
                  The deployment uses an external project-scoped Docker network so the services can
                  communicate cleanly across the stack.
                </li>
              </ul>
            </Section>

            <Section title="Operational Tooling">
              <p>
                The project also demonstrates practical developer operations. Startup, shutdown, and
                log monitoring are scripted so the stack can be managed consistently.
              </p>

              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <strong>start.sh</strong> creates the project Docker network if needed and then
                  runs the full Compose stack with a build step.
                </li>
                <li>
                  <strong>stop.sh</strong> tears the environment down cleanly.
                </li>
                <li>
                  <strong>logs.sh</strong> provides an interactive way to tail logs for either the
                  full stack or selected services.
                </li>
              </ul>

              <p>
                This matters for interviews and production-minded demos because it shows attention
                to repeatability, observability, and operational ergonomics rather than only feature
                development.
              </p>
            </Section>

            <Section title="Why This Demonstrates Job-Ready Engineering">
              <p>
                This project is meant to communicate a specific story: I can build AI products as
                real software systems, not just isolated model demos.
              </p>

              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <strong>AI engineering:</strong> workflow design, model integration, context
                  management, and async execution patterns.
                </li>
                <li>
                  <strong>Frontend engineering:</strong> responsive UI, state management, multiple
                  interaction modes, and realtime synchronization.
                </li>
                <li>
                  <strong>Backend engineering:</strong> typed APIs, persistence, job queues, and
                  separation of concerns between chat state and workflow state.
                </li>
                <li>
                  <strong>Infrastructure:</strong> Dockerized services, reverse proxying, self-hosted
                  Supabase components, and reproducible environment setup.
                </li>
                <li>
                  <strong>Product thinking:</strong> the system is designed around tradeoffs,
                  operability, and user experience rather than just technical novelty.
                </li>
              </ul>

              <div className="rounded-2xl border border-gray-200 bg-gray-900 p-4 text-sm leading-7 text-gray-100">
                The intent of this demo is to show the full shape of modern engineering work:
                AI workflows, application architecture, frontend UX, data persistence, background
                processing, and deployment.
              </div>
            </Section>
          </div>
        </div>
      </aside>
    </>
  );
}