"use client";
import { useState } from "react";

type Message = { role: "patient" | "ai"; text: string };

export default function Home() {
  const [step, setStep] = useState<"language" | "consent" | "intake">("language");
  const [language, setLanguage] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    speechSynthesis.speak(utterance);
  };

  const askAI = async (transcript: string, history: Message[]) => {
    setIsThinking(true);
    try {
      const res = await fetch("/api/converse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, history }),
      });
      const data = await res.json();
      const aiMessage: Message = { role: "ai", text: data.reply };
      setMessages((prev) => [...prev, aiMessage]);
      speak(data.reply);
    } catch (err) {
      console.error("AI call failed:", err);
      const fallback: Message = { role: "ai", text: "Could you tell me more?" };
      setMessages((prev) => [...prev, fallback]);
      speak(fallback.text);
    } finally {
      setIsThinking(false);
    }
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported. Please use Chrome.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    setIsListening(true);
    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      const patientMessage: Message = { role: "patient", text };
      const updated = [...messages, patientMessage];
      setMessages(updated);
      setIsListening(false);
      askAI(text, updated);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50 p-8">
      <h1 className="text-4xl font-bold text-blue-900 mb-8">MediKiosk</h1>

      {step === "language" && (
        <>
          <p className="text-lg text-gray-700 mb-6">Please select your language</p>
          <div className="flex gap-4">
            {["English", "Hindi", "Tamil"].map((lang) => (
              <button
                key={lang}
                onClick={() => {
                  setLanguage(lang);
                  setStep("consent");
                }}
                className="px-6 py-3 rounded-xl text-lg font-medium border-2 bg-white text-blue-900 border-blue-300 hover:bg-blue-100"
              >
                {lang}
              </button>
            ))}
          </div>
        </>
      )}

      {step === "consent" && (
        <div className="max-w-md text-center bg-white p-8 rounded-2xl shadow-md">
          <h2 className="text-2xl font-semibold text-blue-900 mb-4">Consent</h2>
          <p className="text-gray-600 mb-6">
            We will record your voice and answers to prepare a medical history
            summary for your doctor. Your data is kept private and used only
            for your consultation today.
          </p>
          <button
            onClick={() => setStep("intake")}
            className="px-8 py-3 bg-blue-600 text-white rounded-xl text-lg font-medium hover:bg-blue-700"
          >
            I Agree, Continue
          </button>
        </div>
      )}

      {step === "intake" && (
        <div className="max-w-xl w-full bg-white p-8 rounded-2xl shadow-md">
          <h2 className="text-2xl font-semibold text-blue-900 mb-4 text-center">
            {messages.length === 0 ? "What brings you in today?" : "Please continue"}
          </h2>

          <div className="mb-6 space-y-3 max-h-80 overflow-y-auto">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg ${
                  m.role === "patient" ? "bg-blue-100 text-blue-900 ml-8" : "bg-gray-100 text-gray-800 mr-8"
                }`}
              >
                <span className="text-xs font-semibold uppercase opacity-60 block mb-1">
                  {m.role === "patient" ? "You" : "MediKiosk"}
                </span>
                {m.text}
              </div>
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={startListening}
              disabled={isListening || isThinking}
              className="px-8 py-4 bg-red-500 text-white rounded-full text-lg font-medium hover:bg-red-600 disabled:opacity-50"
            >
              {isListening ? "🎤 Listening..." : isThinking ? "🤔 Thinking..." : "🎤 Tap to Speak"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}