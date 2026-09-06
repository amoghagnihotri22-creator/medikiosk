"use client";
import { useState } from "react";

export default function Home() {
  const [step, setStep] = useState<"language" | "consent" | "done">("language");
  const [language, setLanguage] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");

  const startListening = () => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser. Please use Chrome.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
    };
    recognition.onerror = (event: any) => {
      console.log("Speech recognition error:", event.error);
    };
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
            onClick={() => setStep("done")}
            className="px-8 py-3 bg-blue-600 text-white rounded-xl text-lg font-medium hover:bg-blue-700"
          >
            I Agree, Continue
          </button>
        </div>
      )}
      {step === "done" && (
        <div className="max-w-md text-center bg-white p-8 rounded-2xl shadow-md">
          <h2 className="text-2xl font-semibold text-blue-900 mb-4">
            What brings you in today?
          </h2>
          <button
            onClick={startListening}
            className="px-8 py-4 bg-red-500 text-white rounded-full text-lg font-medium hover:bg-red-600 mb-6"
          >
            🎤 Tap to Speak
          </button>
          <p className="text-gray-700 min-h-[3rem]">
            {transcript ? `You said: "${transcript}"` : "Waiting for you to speak..."}
          </p>
        </div>
      )}
    </div>
  );
}