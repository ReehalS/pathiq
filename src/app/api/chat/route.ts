import { NextRequest } from "next/server";
import { openai } from "@/lib/openai";
import { supabase } from "@/lib/supabase";
import { ChatCompletionMessageParam, ChatCompletionTool } from "openai/resources/chat/completions";

const tools: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "searchCareers",
      description: "Search career paths by keyword, category, or criteria",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search keyword" },
          category: { type: "string", description: "Career category (tech, business, healthcare, engineering, science, law, education, creative, alternative)" },
          minSalary: { type: "number", description: "Minimum median salary filter" },
          pathType: { type: "string", description: "Path type (industry-job, graduate-school, research, professional-school, alternative)" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getCareerDetails",
      description: "Get detailed information about a specific career path",
      parameters: {
        type: "object",
        properties: {
          careerId: { type: "string", description: "Career ID (e.g., software-engineer, data-scientist)" },
        },
        required: ["careerId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "compareCareers",
      description: "Compare 2-3 career paths side by side",
      parameters: {
        type: "object",
        properties: {
          careerIds: {
            type: "array",
            items: { type: "string" },
            description: "Array of career IDs to compare",
          },
        },
        required: ["careerIds"],
      },
    },
  },
];

async function executeToolCall(name: string, args: Record<string, unknown>) {
  switch (name) {
    case "searchCareers": {
      let query = supabase.from("careers").select("id, title, category, path_type, salary_median, salary_entry, growth_rate, growth_rate_numeric, current_openings, description, layoff_risk, is_trending");
      if (args.query) {
        const q = args.query as string;
        query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%,category.ilike.%${q}%,id.ilike.%${q}%`);
      }
      if (args.category) {
        query = query.eq("category", args.category);
      }
      if (args.minSalary) {
        query = query.gte("salary_median", args.minSalary);
      }
      if (args.pathType) {
        query = query.eq("path_type", args.pathType);
      }
      query = query.order("salary_median", { ascending: false }).limit(10);
      const { data } = await query;
      return data || [];
    }
    case "getCareerDetails": {
      const { data } = await supabase
        .from("careers")
        .select("*")
        .eq("id", args.careerId)
        .single();
      return data;
    }
    case "compareCareers": {
      const ids = args.careerIds as string[];
      const { data } = await supabase
        .from("careers")
        .select("id, title, category, salary_entry, salary_median, salary_year5, salary_year10, growth_rate, growth_rate_numeric, current_openings, employment_total, minimum_degree, work_life_balance, remote_options, layoff_risk, career_ceiling")
        .in("id", ids);
      return data || [];
    }
    default:
      return { error: "Unknown tool" };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, userProfile, aboutCareerId } = body as {
      messages: { role: string; content: string }[];
      userProfile?: { name?: string; major?: string; year?: string; interests?: string[] };
      aboutCareerId?: string;
    };

    const userName = userProfile?.name ? ` named ${userProfile.name}` : "";
    const userContext = userProfile?.year
      ? `User context: A${userName} ${userProfile.year} ${userProfile.major || "undergraduate"} student interested in ${(userProfile.interests || []).join(", ") || "exploring options"}.`
      : `User context: An undergraduate student${userName} exploring career options.`;

    // Pre-fetch career data if navigated from a career detail page
    let careerContext = "";
    if (aboutCareerId) {
      const { data: career } = await supabase
        .from("careers")
        .select("*")
        .eq("id", aboutCareerId)
        .single();
      if (career) {
        careerContext = `\n\nThe user is asking about this specific career from our database:\n${JSON.stringify(career, null, 2)}\n\nUse this data to answer their question. You MUST cite these real numbers, do NOT use general knowledge for salary or growth figures.`;
      }
    }

    const systemMessage: ChatCompletionMessageParam = {
      role: "system",
      content: `You are PathIQ, an AI career advisor with real-time access to labor market data.
You help undergraduate students explore and compare post-graduation career paths.

${userContext}

Guidelines:
- ALWAYS use the provided tools to query the database for specific data before answering (don't make up numbers or use general knowledge)
- Cite data sources (BLS, O*NET) when sharing statistics
- Suggest 2-3 specific career paths when relevant
- Keep responses concise (100-150 words)
- Be supportive and encouraging but data-driven
- If asked about paths not in the database, acknowledge limitations
- End with a follow-up question or actionable next step
- Format salary values with dollar signs and commas
- When comparing, highlight the key trade-off clearly${careerContext}`,
    };

    const apiMessages: ChatCompletionMessageParam[] = [
      systemMessage,
      ...messages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
    ];

    // First call - may include tool calls
    let completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: apiMessages,
      tools,
      tool_choice: "auto",
      stream: false,
    });

    let responseMessage = completion.choices[0]?.message;

    // Handle tool calls (up to 3 rounds)
    let rounds = 0;
    while (responseMessage?.tool_calls && rounds < 3) {
      rounds++;
      const toolMessages: ChatCompletionMessageParam[] = [
        ...apiMessages,
        responseMessage as ChatCompletionMessageParam,
      ];

      for (const toolCall of responseMessage.tool_calls) {
        if (toolCall.type !== "function") continue;
        const fn = toolCall.function;
        const args = JSON.parse(fn.arguments);
        const result = await executeToolCall(fn.name, args);

        toolMessages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
      }

      completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: toolMessages,
        tools,
        tool_choice: "auto",
      });

      responseMessage = completion.choices[0]?.message;
    }

    const content = responseMessage?.content || "I'm sorry, I couldn't generate a response. Please try again.";

    // Stream-like response using ReadableStream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        // Send the content in chunks to simulate streaming
        const words = content.split(" ");
        let i = 0;
        const interval = setInterval(() => {
          if (i >= words.length) {
            controller.close();
            clearInterval(interval);
            return;
          }
          const chunk = (i === 0 ? "" : " ") + words[i];
          controller.enqueue(encoder.encode(chunk));
          i++;
        }, 20);
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (e) {
    console.error("Chat error:", e);
    return new Response("I'm sorry, something went wrong. Please try again.", {
      status: 500,
      headers: { "Content-Type": "text/plain" },
    });
  }
}
