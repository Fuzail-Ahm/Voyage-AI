"use client";

import { FormEvent, useState } from "react";

type TripCopilotProps = {
  trip: any;
  onTripUpdate: (updatedTrip: any) => void;
};

type CopilotResponse = {
  message: string;
  action: string;
  changes: any[];
};

export default function TripCopilot({
  trip,
  onTripUpdate,
}: TripCopilotProps) {
  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState<
    {
      role: "user" | "assistant";
      content: string;
    }[]
  >([]);

  const [loading, setLoading] = useState(false);

  async function sendMessage(
    event?: FormEvent
  ) {
    event?.preventDefault();

    const trimmed = message.trim();

    if (!trimmed || loading) {
      return;
    }

    setMessages((previous) => [
      ...previous,
      {
        role: "user",
        content: trimmed,
      },
    ]);

    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(
  `${process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000"}/copilot/chat`,
  {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: trimmed,
            trip,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Copilot returned ${response.status}`
        );
      }

      const data: CopilotResponse =
        await response.json();

      /*
       * ----------------------------------------------------
       * APPLY COPILOT MODIFICATIONS
       * ----------------------------------------------------
       */

      let updatedTrip = trip;

      if (
        data.action === "modify_itinerary" &&
        Array.isArray(data.changes)
      ) {
        updatedTrip = {
          ...trip,
          itinerary: Array.isArray(
            trip.itinerary
          )
            ? trip.itinerary.map(
                (day: any) => {
                  let updatedDay = {
                    ...day,
                  };

                  data.changes.forEach(
                    (change: any) => {
                      if (
                        change?.type ===
                          "update_day" &&
                        Number(
                          change?.day
                        ) ===
                          Number(
                            day?.day
                          )
                      ) {
                        /*
                         * Apply requested field updates
                         */

                        if (
                          change.updates &&
                          typeof change.updates ===
                            "object"
                        ) {
                          updatedDay = {
                            ...updatedDay,
                            ...change.updates,
                          };
                        }

                        /*
                         * Remove requested fields
                         */

                        if (
                          Array.isArray(
                            change.remove_fields
                          )
                        ) {
                          change.remove_fields.forEach(
                            (field: string) => {
                              delete updatedDay[
                                field
                              ];
                            }
                          );
                        }
                      }
                    }
                  );

                  return updatedDay;
                }
              )
            : trip.itinerary,
        };

        /*
         * Send updated trip back to page.tsx
         */

        if (
          updatedTrip !== trip
        ) {
          onTripUpdate(updatedTrip);
        }
      }

      /*
       * Add assistant response
       */

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: data.message,
        },
      ]);
    } catch (error) {
      console.error(
        "Copilot error:",
        error
      );

      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content:
            "I couldn't reach VoyageAI Copilot right now. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function useSuggestion(
    suggestion: string
  ) {
    setMessage(suggestion);
  }

  return (
    <section className="mt-24">

      <div className="overflow-hidden rounded-[2rem] border border-black/[0.06] bg-[#171717] text-white shadow-[0_30px_100px_rgba(0,0,0,0.12)]">

        {/* HEADER */}

        <div className="p-7 md:p-10">

          <div className="flex items-start justify-between gap-6">

            <div>

              <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#d4b27b]">
                VoyageAI · Copilot
              </p>

              <h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
                Your AI travel companion.
              </h2>

              <p className="mt-3 max-w-xl text-sm leading-6 text-white/45 md:text-base">
                Ask anything about your current
                journey. I know your itinerary,
                preferences, budget and
                recommendations.
              </p>

            </div>

            <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xl md:flex">
              ✦
            </div>

          </div>

          {/* SUGGESTIONS */}

          <div className="mt-8 flex flex-wrap gap-2">

            {[
              "Make Day 2 more relaxed",
              "Add more nightlife",
              "What should I do if it rains?",
              "Recommend a romantic dinner",
            ].map((suggestion) => (

              <button
                key={suggestion}
                type="button"
                onClick={() =>
                  useSuggestion(
                    suggestion
                  )
                }
                disabled={loading}
                className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-white/60 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white disabled:opacity-40"
              >
                {suggestion}
              </button>

            ))}

          </div>

        </div>

        {/* CONVERSATION */}

        {messages.length > 0 && (

          <div className="max-h-[420px] space-y-4 overflow-y-auto border-t border-white/[0.06] px-7 py-7 md:px-10">

            {messages.map(
              (item, index) => (

                <div
                  key={`${item.role}-${index}`}
                  className={
                    item.role === "user"
                      ? "flex justify-end"
                      : "flex justify-start"
                  }
                >

                  <div
                    className={
                      item.role === "user"
                        ? "max-w-[85%] rounded-2xl rounded-br-md bg-white px-5 py-3 text-sm text-black"
                        : "max-w-[85%] rounded-2xl rounded-bl-md bg-white/[0.06] px-5 py-4 text-sm leading-6 text-white/75"
                    }
                  >
                    {item.content}
                  </div>

                </div>

              )
            )}

            {loading && (

              <div className="flex justify-start">

                <div className="rounded-2xl rounded-bl-md bg-white/[0.06] px-5 py-4 text-sm text-white/50">
                  <span className="animate-pulse">
                    Thinking...
                  </span>
                </div>

              </div>

            )}

          </div>

        )}

        {/* INPUT */}

        <form
          onSubmit={sendMessage}
          className="border-t border-white/[0.06] p-5 md:p-7"
        >

          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-2 transition focus-within:border-white/20">

            <input
              value={message}
              onChange={(event) =>
                setMessage(
                  event.target.value
                )
              }
              placeholder="Ask about your journey..."
              disabled={loading}
              className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-white/30"
            />

            <button
              type="submit"
              disabled={
                !message.trim() ||
                loading
              }
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-black transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Send message"
            >
              ↑
            </button>

          </div>

          <p className="mt-3 px-2 text-[11px] text-white/25">
            VoyageAI Copilot uses your current
            trip as context.
          </p>

        </form>

      </div>

    </section>
  );
}