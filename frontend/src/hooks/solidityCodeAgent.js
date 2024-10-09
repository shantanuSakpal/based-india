import { useState, useEffect } from "react";
import { AssistantStream } from "openai/lib/AssistantStream";

export function solidityCodeAgent() {
  const [agentResponse, setAgentResponse] = useState(
    "// Solidity code will appear here"
  );
  const [inputDisabled, setInputDisabled] = useState(false);
  const [threadId, setThreadId] = useState("");

  useEffect(() => {
    const createThread = async () => {
      const res = await fetch(`/api/assistants/threads`, { method: "POST" });
      const data = await res.json();
      setThreadId(data.threadId);
    };
    createThread();
  }, []);

  const handleRunAgent = async (userInput) => {
    if (!userInput.trim()) return;
    setInputDisabled(true);
    const response = await fetch(
      `/api/assistants/threads/${threadId}/messages`,
      {
        method: "POST",
        body: JSON.stringify({ content: userInput, agentName: "solidity" }),
      }
    );
    const stream = AssistantStream.fromReadableStream(response.body);
    handleReadableStream(stream);
  };

  function removeSolidityFormatting(inputString) {
    // Remove any "```solidity" at the beginning or end of the input
    return inputString
      .trim()
      .replace(/```solidity/g, "")
      .replace(/```/g, "")
      .trim();
  }

  const handleReadableStream = (stream) => {
    let accumulatedResponse = "";
    stream.on("textDelta", (delta) => {
      if (delta.value != null) {
        accumulatedResponse += delta.value;
      }
    });
    stream.on("event", (event) => {
      if (event.event === "thread.run.completed") {
        console.log("agent respose", accumulatedResponse);

        const processed_ans = removeSolidityFormatting(accumulatedResponse);
        setAgentResponse(processed_ans);
        setInputDisabled(false);
      }
    });
  };

  return {
    agentResponse,
    handleRunAgent,
    inputDisabled,
  };
}
