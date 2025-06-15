import React, { useState } from "react";

const App = () => {
  const [apiKey, setApiKey] = useState("");
  const [message, setMessage] = useState("");
  const [chatLog, setChatLog] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!apiKey || !message) return;

    setLoading(true);
    const userMessage = { role: "user", content: message };
    const updatedChat = [...chatLog, userMessage];

    const threadRes = await fetch("https://api.openai.com/v1/threads", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ messages: [userMessage] })
    });
    const thread = await threadRes.json();

    const runRes = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ assistant_id: "asst_f8FQkfHZ4UbyjdrfhZ4Jbr9W" })
    });
    const runData = await runRes.json();

    let completed = false;
    let output = "";
    while (!completed) {
      const status = await fetch(`https://api.openai.com/v1/threads/${thread.id}/runs/${runData.id}`, {
        headers: { "Authorization": `Bearer ${apiKey}` }
      });
      const data = await status.json();
      if (data.status === "completed") {
        const messages = await fetch(`https://api.openai.com/v1/threads/${thread.id}/messages`, {
          headers: { "Authorization": `Bearer ${apiKey}` }
        });
        const finalMessages = await messages.json();
        output = finalMessages.data[0]?.content[0]?.text?.value || "";
        completed = true;
      }
      await new Promise(r => setTimeout(r, 1000));
    }

    setChatLog([...updatedChat, { role: "assistant", content: output }]);
    setMessage("");
    setLoading(false);
  };

  return (
    <div style={{ padding: 20, fontFamily: "Arial" }}>
      <h2>Shopina Chatbot</h2>
      {!apiKey ? (
        <div>
          <p>Voer je OpenAI API-key in:</p>
          <input
            type="password"
            onChange={(e) => setApiKey(e.target.value)}
            style={{ width: "100%", padding: "8px" }}
          />
        </div>
      ) : (
        <div>
          <div style={{ maxHeight: "300px", overflowY: "auto", border: "1px solid #ccc", padding: "10px", marginBottom: "10px" }}>
            {chatLog.map((msg, idx) => (
              <p key={idx}><strong>{msg.role === "user" ? "Jij" : "Assistant"}:</strong> {msg.content}</p>
            ))}
          </div>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Typ je bericht..."
            style={{ width: "80%", padding: "8px" }}
          />
          <button onClick={sendMessage} disabled={loading} style={{ padding: "8px", marginLeft: "10px" }}>
            Verzenden
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
