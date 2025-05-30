
// *******************Neha's part********************

import React from "react";
import Chatbot from "react-chatbotify";

import "./Chatbot.css"; // Custom styling

const Helperbot = () => {
  return (
    <div className="helper-chatbot-container">
      <Chatbot
        assistant={{
          name: "Helper Bot",
          description: "I'm here to assist you!",
          avatar: "https://cdn-icons-png.flaticon.com/512/4712/4712139.png", // Chatbot avatar
        }}
        config={{
          welcomeMessage: "👋 Hi there! Need help?",
          chatWindow: {
            position: "bottom-right",
            width: "220px", // Adjust width to match the image
            height: "450px",
            theme: {
              primaryColor: "#6a1b9a", // Purple background for bot messages
              secondaryColor: "#ffffff", // White for user messages
              borderRadius: "15px",
            },
          },
        }}
        messages={[
          {
            patterns: ["hello", "hi", "hey"],
            responses: ["Hello! How can I assist you today? 😊"],
          },
          {
            patterns: ["help", "support"],
            responses: [
              "Here are a few helpful things you can check out:",
              {
                type: "buttons",
                buttons: [
                  { text: "Quickstart", url: "/quickstart" },
                  { text: "API Docs", url: "/api-docs" },
                  { text: "Examples", url: "/examples" },
                  { text: "Github", url: "https://github.com" },
                  { text: "Discord", disabled: true }, // Disabled button (like the image)
                ],
              },
            ],
          },
          {
            patterns: ["Quickstart"],
            responses: ["Sit tight! I'll send you right there! 🚀"],
          },
        ]}
      />
    </div>
  );
};

export default Helperbot;
