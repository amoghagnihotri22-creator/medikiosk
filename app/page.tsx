"use client";
import { useState } from "react";

type Message = { role: "patient" | "ai"; text: string };

export default function Home() {
  const [step, setStep] = useState<"language" | "consent" | "documents" | "intake">("language");
  const [language, setLanguage] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const patientId = "demo-patient-1";

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    speechSynthesis.speak(utterance);
  };

  const finalizePatientRecord = async (finalMessages: Message[]) => {
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: finalMessages, ocrResult: uploadResult }),
      });
      const summary = await res.json();

      const patient = {
        patientId: "live-demo",
        patientName: "Live Demo Patient",
        dateOfBirth: "N/A",
        lastUpdated: "Just now",
        source: { fromConversation: true, fromDocuments: !!uploadResult },
        chiefComplaint: summary.chiefComplaint || "",
        symptoms: (summary.symptoms || []).map((s: any) => ({ ...s, source: "conversation" })),
        medications: (summary.medications || []).map((m: any) => ({
          ...m,
          source: uploadResult ? "document" : "conversation",
        })),
        allergies: (summary.allergies || []).map((a: any) => ({
          ...a,
          source: uploadResult ? "document" : "conversation",
        })),
        pastConditions: (summary.pastConditions || []).map((p: any) => ({
          ...p,
          source: uploadResult ? "document" : "conversation",
        })),
        uploadedDocuments: uploadResult
          ? [
              {
                id: uploadResult.documentId,
                fileName: "uploaded_document",
                type: uploadResult.documentType,
                uploadedAt: "Just now",
                ocrConfidence: uploadResult.ocrConfidence,
              },
            ]
          : [],
        aiSummary: summary.aiSummary || null,
        flags: summary.flags || [],
        transcript: finalMessages.map((m) => ({
          speaker: m.role === "patient" ? "Patient" : "AI",
          time: "",
          text: m.text,
        })),
        reviewed: false,
        notes: [],
      };

      localStorage.setItem("medikiosk_live_patient", JSON.stringify(patient));
    } catch (err) {
      console.error("Failed to finalize patient record:", err);
    }
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
      if (data.reply.toLowerCase().includes("i have everything i need")) {
        setIsComplete(true);
        finalizePatientRecord([...history, aiMessage]);
      }
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append("document", file);

      const res = await fetch(`http://localhost:4000/api/patients/${patientId}/documents`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      setUploadResult(data);
    } catch (err) {
      console.error("OCR upload failed:", err);
      setUploadError("Could not process the document. You can skip this step and continue.");
    } finally {
      setIsUploading(false);
    }
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
            onClick={() => setStep("documents")}
            className="px-8 py-3 bg-blue-600 text-white rounded-xl text-lg font-medium hover:bg-blue-700"
          >
            I Agree, Continue
          </button>
        </div>
      )}

      {step === "documents" && (
        <div className="max-w-md w-full text-center bg-white p-8 rounded-2xl shadow-md">
          <h2 className="text-2xl font-semibold text-blue-900 mb-2">
            Do you have any prior prescriptions or reports?
          </h2>
          <p className="text-gray-600 mb-6 text-sm">
            Upload a photo and we'll extract the details automatically.
          </p>

          <label className="block mb-4">
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-100 file:text-blue-800 file:font-medium hover:file:bg-blue-200"
            />
          </label>

          {isUploading && (
            <p className="text-blue-600 font-medium mb-4">📄 Reading document...</p>
          )}

          {uploadError && (
            <p className="text-red-600 text-sm mb-4">{uploadError}</p>
          )}

          {uploadResult && (
            <div className="text-left bg-green-50 border border-green-200 rounded-lg p-4 mb-4 text-sm">
              <p className="font-semibold text-green-800 mb-2">✅ Document processed</p>
              {uploadResult.extractedFields?.chiefComplaint && (
                <p className="mb-1">
                  <span className="font-medium">Complaint:</span>{" "}
                  {uploadResult.extractedFields.chiefComplaint.value}
                </p>
              )}
              {uploadResult.extractedFields?.medications?.length > 0 && (
                <p className="mb-1">
                  <span className="font-medium">Medications:</span>{" "}
                  {uploadResult.extractedFields.medications.map((m: any) => m.name).join(", ")}
                </p>
              )}
              {uploadResult.extractedFields?.allergies?.length > 0 && (
                <p>
                  <span className="font-medium">Allergies:</span>{" "}
                  {uploadResult.extractedFields.allergies.map((a: any) => a.substance).join(", ")}
                </p>
              )}
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => setStep("intake")}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700"
            >
              {uploadResult ? "Continue" : "Skip this step"}
            </button>
          </div>
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

          {isComplete ? (
            <div className="text-center bg-green-50 border-2 border-green-200 rounded-xl p-6">
              <div className="text-4xl mb-3">✅</div>
              <h3 className="text-xl font-semibold text-green-800 mb-2">
                Thank you for sharing your symptoms
              </h3>
              <p className="text-green-700">
                Your history has been recorded. Please take a seat — your doctor
                will review your summary shortly.
              </p>
            </div>
          ) : (
            <div className="text-center">
              <button
                onClick={startListening}
                disabled={isListening || isThinking}
                className="px-8 py-4 bg-red-500 text-white rounded-full text-lg font-medium hover:bg-red-600 disabled:opacity-50"
              >
                {isListening ? "🎤 Listening..." : isThinking ? "🤔 Thinking..." : "🎤 Tap to Speak"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
