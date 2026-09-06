"use client";
import React, { useState, useMemo } from "react";
import {
  Search,
  MessageSquare,
  FileText,
  ShieldCheck,
  AlertTriangle,
  Clock3,
  AlertCircle,
  ArrowLeft,
  Pencil,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
} from "lucide-react";

/* ---------------------------------------------------------------------- */
/*  Tokens                                                                 */
/* ---------------------------------------------------------------------- */

const C = {
  ink: "#1C232C",
  inkMuted: "#5B6673",
  inkFaint: "#8892A0",
  line: "#DEE3E7",
  lineSoft: "#EAEDEF",
  bg: "#F3F5F6",
  surface: "#FFFFFF",
  verified: "#0E6E66",
  verifiedBg: "#E7F2F0",
  conversation: "#3B5BA9",
  conversationBg: "#EAEEF8",
  document: "#8A5A2B",
  documentBg: "#F3EAE0",
  urgent: "#B23A2E",
  urgentBg: "#FBEAE8",
  review: "#B9820A",
  reviewBg: "#FBF1DC",
  doctor: "#6B4FA0",
  doctorBg: "#EFEAF7",
};

const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');`;

/* ---------------------------------------------------------------------- */
/*  Mock data — stands in for GET /api/patients + /:id/history + timeline  */
/* ---------------------------------------------------------------------- */

const INITIAL_PATIENTS = [
  {
    patientId: "p1",
    patientName: "Maria Alvarez",
    dateOfBirth: "1985-03-12",
    lastUpdated: "Today, 8:14 AM",
    source: { fromConversation: true, fromDocuments: false },
    chiefComplaint:
      "Sudden chest tightness and shortness of breath, started about two hours ago.",
    symptoms: [
      {
        name: "Chest tightness",
        onset: "2 hours ago",
        severity: "Severe",
        notes: "Radiates to left arm; worse on exertion",
        source: "conversation",
      },
      {
        name: "Shortness of breath",
        onset: "2 hours ago",
        severity: "Moderate",
        notes: "",
        source: "conversation",
      },
    ],
    medications: [
      { name: "Lisinopril", dosage: "10mg", frequency: "Once daily", source: "conversation" },
    ],
    allergies: [{ substance: "Penicillin", reaction: "Hives", source: "conversation" }],
    pastConditions: [
      { condition: "Hypertension", diagnosedDate: "2019", source: "conversation" },
    ],
    uploadedDocuments: [],
    aiSummary:
      "Patient reports acute onset chest tightness with radiation to the left arm, accompanied by shortness of breath, beginning roughly two hours prior to intake. No prior cardiac history disclosed beyond hypertension. Denies similar prior episodes. Flagged for urgent review given symptom pattern.",
    flags: [
      {
        type: "urgent",
        message: "Possible cardiac event — chest pain with radiation. Review immediately.",
      },
    ],
    transcript: [
      { speaker: "AI", time: "8:02 AM", text: "What brings you in today?" },
      {
        speaker: "Patient",
        time: "8:03 AM",
        text: "My chest feels really tight and I'm having trouble breathing. It started about two hours ago.",
      },
      { speaker: "AI", time: "8:03 AM", text: "Does the tightness spread anywhere, like your arm or jaw?" },
      { speaker: "Patient", time: "8:04 AM", text: "Yeah, it goes down my left arm." },
      { speaker: "AI", time: "8:05 AM", text: "Are you currently taking any medications?" },
      { speaker: "Patient", time: "8:05 AM", text: "Just lisinopril, 10 milligrams, once a day for blood pressure." },
    ],
    reviewed: false,
    notes: [],
  },
  {
    patientId: "p2",
    patientName: "James Whitfield",
    dateOfBirth: "1962-11-02",
    lastUpdated: "Yesterday, 4:47 PM",
    source: { fromConversation: false, fromDocuments: true },
    chiefComplaint: "Follow-up for chronic lower back pain (per referral letter).",
    symptoms: [
      {
        name: "Lower back pain",
        onset: "Chronic, 3+ years",
        severity: "Moderate",
        notes: "Extracted from referral letter",
        source: "document",
        confidence: 0.94,
      },
    ],
    medications: [
      { name: "Ibuprofen", dosage: "400mg", frequency: "As needed", source: "document", confidence: 0.92 },
      {
        name: "Amlodipine",
        dosage: "5mg",
        frequency: "Once daily",
        source: "document",
        confidence: 0.61,
      },
    ],
    allergies: [
      { substance: "Sulfa drugs", reaction: "Rash", source: "document", confidence: 0.88 },
    ],
    pastConditions: [
      { condition: "Type 2 diabetes", diagnosedDate: "2016", source: "document", confidence: 0.9 },
      {
        condition: "Lumbar disc herniation",
        diagnosedDate: "2021",
        source: "document",
        confidence: 0.85,
      },
    ],
    uploadedDocuments: [
      {
        id: "d1",
        fileName: "referral_letter_scan.pdf",
        type: "Referral letter",
        uploadedAt: "Sep 4, 2026",
        ocrConfidence: 0.94,
      },
      {
        id: "d2",
        fileName: "lab_results_2026.pdf",
        type: "Lab report",
        uploadedAt: "Sep 4, 2026",
        ocrConfidence: 0.61,
      },
    ],
    aiSummary: null,
    flags: [
      {
        type: "review",
        message: "One or more fields were extracted with low OCR confidence — verify against source.",
      },
      {
        type: "incomplete",
        message: "No chief complaint captured directly from the patient.",
      },
    ],
    transcript: [],
    reviewed: false,
    notes: [],
  },
  {
    patientId: "p3",
    patientName: "Priya Nandakumar",
    dateOfBirth: "1993-07-21",
    lastUpdated: "Today, 9:31 AM",
    source: { fromConversation: true, fromDocuments: true },
    chiefComplaint: "Recurring migraines, increasing in frequency over the past month.",
    symptoms: [
      {
        name: "Migraine",
        onset: "Past month, increasing frequency",
        severity: "Moderate–severe",
        notes: "Photophobia and nausea accompany episodes",
        source: "conversation",
      },
    ],
    medications: [
      { name: "Sumatriptan", dosage: "50mg", frequency: "As needed for migraine", source: "conversation" },
      { name: "Metformin", dosage: "500mg", frequency: "Twice daily", source: "document", confidence: 0.91 },
    ],
    allergies: [{ substance: "None reported", reaction: "", source: "conversation" }],
    pastConditions: [
      { condition: "Type 2 diabetes", diagnosedDate: "2020", source: "document", confidence: 0.9 },
      { condition: "Migraine with aura", diagnosedDate: "2022", source: "conversation" },
    ],
    uploadedDocuments: [
      {
        id: "d3",
        fileName: "endocrinology_notes.pdf",
        type: "Specialist notes",
        uploadedAt: "Sep 5, 2026",
        ocrConfidence: 0.88,
      },
    ],
    aiSummary:
      "Patient describes migraines increasing in frequency over the past month, now several times weekly, with associated photophobia and nausea. Currently manages acute episodes with sumatriptan. Mentioned 'other pills' for an unrelated condition without specifying — cross-referenced with uploaded endocrinology notes showing metformin for type 2 diabetes.",
    flags: [
      {
        type: "incomplete",
        message: 'Patient mentioned "other pills" without specifying — confirm full medication list.',
      },
    ],
    transcript: [
      { speaker: "AI", time: "9:20 AM", text: "What brings you in today?" },
      {
        speaker: "Patient",
        time: "9:21 AM",
        text: "My migraines have been getting worse. They used to happen once a month, now it's a few times a week.",
      },
      { speaker: "AI", time: "9:22 AM", text: "Do you notice any other symptoms with the migraines?" },
      { speaker: "Patient", time: "9:22 AM", text: "Light really bothers me and I sometimes feel nauseous." },
      { speaker: "AI", time: "9:23 AM", text: "Are you taking anything for them currently?" },
      {
        speaker: "Patient",
        time: "9:24 AM",
        text: "Sumatriptan when it gets bad. I'm also on some other pills for something unrelated, I don't remember the name.",
      },
    ],
    reviewed: false,
    notes: [],
  },
];

/* ---------------------------------------------------------------------- */
/*  Small shared bits                                                      */
/* ---------------------------------------------------------------------- */

function SourceBadge({ source, confidence }) {
  const map = {
    conversation: { label: "Conversation", color: C.conversation, bg: C.conversationBg, Icon: MessageSquare },
    document: { label: "Document", color: C.document, bg: C.documentBg, Icon: FileText },
    doctor: { label: "Doctor-verified", color: C.doctor, bg: C.doctorBg, Icon: ShieldCheck },
  };
  const m = map[source] || map.conversation;
  const lowConfidence = source === "document" && typeof confidence === "number" && confidence < 0.75;
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
        style={{ color: m.color, background: m.bg }}
      >
        <m.Icon size={12} strokeWidth={2.25} />
        {m.label}
      </span>
      {lowConfidence && (
        <span
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
          style={{ color: C.review, background: C.reviewBg }}
          title="Low OCR confidence — verify against the source document"
        >
          <AlertCircle size={12} strokeWidth={2.25} />
          {Math.round(confidence * 100)}% confidence
        </span>
      )}
    </span>
  );
}

function FlagChip({ flag, compact }) {
  const map = {
    urgent: { label: "Urgent", color: C.urgent, bg: C.urgentBg, Icon: AlertTriangle },
    review: { label: "Needs review", color: C.review, bg: C.reviewBg, Icon: AlertCircle },
    incomplete: { label: "Incomplete", color: C.inkMuted, bg: C.lineSoft, Icon: Clock3 },
  };
  const m = map[flag.type] || map.review;
  if (compact) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold"
        style={{ color: m.color, background: m.bg }}
      >
        <m.Icon size={12} strokeWidth={2.5} />
        {m.label}
      </span>
    );
  }
  return (
    <div
      className="flex items-start gap-2.5 rounded-lg px-3.5 py-2.5"
      style={{ background: m.bg, border: `1px solid ${m.color}33` }}
    >
      <m.Icon size={16} strokeWidth={2.25} style={{ color: m.color, marginTop: 2, flexShrink: 0 }} />
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: m.color, letterSpacing: "0.04em" }}>
          {m.label}
        </div>
        <div className="text-sm mt-0.5" style={{ color: C.ink }}>
          {flag.message}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  Patient queue                                                          */
/* ---------------------------------------------------------------------- */

function PatientQueue({ patients, selectedId, onSelect, query, setQuery, filter, setFilter }) {
  const filters = [
    { id: "all", label: "All" },
    { id: "urgent", label: "Urgent" },
    { id: "review", label: "Needs review" },
    { id: "incomplete", label: "Incomplete" },
  ];

  const filtered = useMemo(() => {
    return patients.filter((p) => {
      const matchesQuery = p.patientName.toLowerCase().includes(query.toLowerCase());
      const matchesFilter = filter === "all" || p.flags.some((f) => f.type === filter);
      return matchesQuery && matchesFilter;
    });
  }, [patients, query, filter]);

  return (
    <div className="flex h-full flex-col" style={{ borderRight: `1px solid ${C.line}` }}>
      <div className="px-5 pt-5 pb-3" style={{ borderBottom: `1px solid ${C.line}` }}>
        <h1
          className="text-lg font-semibold"
          style={{ fontFamily: "'Source Serif 4', serif", color: C.ink }}
        >
          Patient queue
        </h1>
        <p className="text-xs mt-0.5" style={{ color: C.inkMuted }}>
          {filtered.length} of {patients.length} patients
        </p>

        <div className="relative mt-3">
          <Search size={15} style={{ position: "absolute", left: 10, top: 9, color: C.inkFaint }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search patients"
            className="w-full rounded-md py-1.5 pl-8 pr-3 text-sm outline-none"
            style={{ background: C.bg, border: `1px solid ${C.line}`, color: C.ink }}
          />
        </div>

        <div className="flex flex-wrap gap-1.5 mt-3">
          {filters.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className="rounded-full px-2.5 py-1 text-xs font-medium transition-colors"
                style={
                  active
                    ? { background: C.ink, color: "#fff" }
                    : { background: C.bg, color: C.inkMuted, border: `1px solid ${C.line}` }
                }
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="px-5 py-10 text-center text-sm" style={{ color: C.inkFaint }}>
            No patients match this view.
          </div>
        )}
        {filtered.map((p) => {
          const selected = p.patientId === selectedId;
          return (
            <button
              key={p.patientId}
              onClick={() => onSelect(p.patientId)}
              className="w-full text-left px-5 py-3.5 transition-colors"
              style={{
                borderBottom: `1px solid ${C.lineSoft}`,
                background: selected ? C.bg : "transparent",
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className="text-sm font-semibold truncate"
                  style={{ fontFamily: "'Source Serif 4', serif", color: C.ink }}
                >
                  {p.patientName}
                </span>
                {p.reviewed && <ShieldCheck size={14} style={{ color: C.verified, flexShrink: 0 }} />}
              </div>
              <div className="flex items-center gap-1.5 mt-1.5">
                {p.source.fromConversation && (
                  <MessageSquare size={12} style={{ color: C.conversation }} />
                )}
                {p.source.fromDocuments && <FileText size={12} style={{ color: C.document }} />}
                <span className="text-xs" style={{ color: C.inkFaint }}>
                  Updated {p.lastUpdated}
                </span>
              </div>
              {p.flags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {p.flags.map((f, i) => (
                    <FlagChip key={i} flag={f} compact />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  Editable text (chief complaint / ai summary override)                  */
/* ---------------------------------------------------------------------- */

function EditableBlock({ label, value, placeholder, onSave, multiline }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");

  if (!editing) {
    return (
      <div>
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.inkFaint, letterSpacing: "0.04em" }}>
            {label}
          </div>
          <button
            onClick={() => {
              setDraft(value || "");
              setEditing(true);
            }}
            className="text-xs inline-flex items-center gap-1 rounded px-1.5 py-0.5"
            style={{ color: C.inkMuted }}
          >
            <Pencil size={11} /> Edit
          </button>
        </div>
        <p className="text-sm mt-1 leading-relaxed" style={{ color: value ? C.ink : C.inkFaint }}>
          {value || placeholder}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: C.inkFaint, letterSpacing: "0.04em" }}>
        {label}
      </div>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={multiline ? 3 : 2}
        autoFocus
        className="w-full mt-1 rounded-md p-2 text-sm outline-none resize-none"
        style={{ border: `1px solid ${C.doctor}`, color: C.ink }}
      />
      <div className="flex gap-2 mt-1.5">
        <button
          onClick={() => {
            onSave(draft);
            setEditing(false);
          }}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-white"
          style={{ background: C.doctor }}
        >
          <Check size={12} /> Save
        </button>
        <button
          onClick={() => setEditing(false)}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium"
          style={{ color: C.inkMuted, border: `1px solid ${C.line}` }}
        >
          <X size={12} /> Cancel
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  Editable list row (symptom / medication / allergy / condition)         */
/* ---------------------------------------------------------------------- */

function EditableRow({ primary, secondary, source, confidence, onVerify, editable = true }) {
  const [editing, setEditing] = useState(false);
  const [draftPrimary, setDraftPrimary] = useState(primary);
  const [draftSecondary, setDraftSecondary] = useState(secondary);

  if (editing) {
    return (
      <div className="rounded-md p-2.5" style={{ border: `1px solid ${C.doctor}` }}>
        <input
          value={draftPrimary}
          onChange={(e) => setDraftPrimary(e.target.value)}
          className="w-full text-sm font-medium outline-none mb-1"
          style={{ color: C.ink }}
        />
        <input
          value={draftSecondary}
          onChange={(e) => setDraftSecondary(e.target.value)}
          className="w-full text-xs outline-none"
          style={{ color: C.inkMuted }}
        />
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => {
              onVerify(draftPrimary, draftSecondary);
              setEditing(false);
            }}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-white"
            style={{ background: C.doctor }}
          >
            <Check size={12} /> Save as doctor-verified
          </button>
          <button
            onClick={() => setEditing(false)}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium"
            style={{ color: C.inkMuted, border: `1px solid ${C.line}` }}
          >
            <X size={12} /> Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-between gap-3 py-2" style={{ borderBottom: `1px solid ${C.lineSoft}` }}>
      <div className="min-w-0">
        <div className="text-sm font-medium" style={{ color: C.ink }}>
          {primary}
        </div>
        {secondary && (
          <div className="text-xs mt-0.5" style={{ color: C.inkMuted }}>
            {secondary}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <SourceBadge source={source} confidence={confidence} />
        {editable && (
          <button onClick={() => setEditing(true)} title="Edit" style={{ color: C.inkFaint }}>
            <Pencil size={13} />
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  Section wrapper                                                        */
/* ---------------------------------------------------------------------- */

function Section({ title, children, empty }) {
  return (
    <div className="rounded-lg p-4" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
      <h3
        className="text-sm font-semibold mb-2"
        style={{ fontFamily: "'Source Serif 4', serif", color: C.ink }}
      >
        {title}
      </h3>
      {empty ? (
        <p className="text-sm" style={{ color: C.inkFaint }}>
          {empty}
        </p>
      ) : (
        children
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  Source timeline                                                        */
/* ---------------------------------------------------------------------- */

function SourceTimeline({ patient }) {
  const [open, setOpen] = useState(false);
  const hasContent = patient.transcript.length > 0 || patient.uploadedDocuments.length > 0;
  if (!hasContent) return null;

  return (
    <div className="rounded-lg" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <span
          className="text-sm font-semibold"
          style={{ fontFamily: "'Source Serif 4', serif", color: C.ink }}
        >
          Source timeline
        </span>
        {open ? <ChevronUp size={16} style={{ color: C.inkMuted }} /> : <ChevronDown size={16} style={{ color: C.inkMuted }} />}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-4" style={{ borderTop: `1px solid ${C.lineSoft}` }}>
          {patient.transcript.length > 0 && (
            <div className="pt-3">
              <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: C.inkFaint, letterSpacing: "0.04em" }}>
                Conversation transcript
              </div>
              <div className="space-y-2">
                {patient.transcript.map((t, i) => (
                  <div key={i} className="flex gap-2 text-sm">
                    <span
                      className="flex-shrink-0 w-16 text-xs font-mono pt-0.5"
                      style={{ color: C.inkFaint, fontFamily: "'IBM Plex Mono', monospace" }}
                    >
                      {t.time}
                    </span>
                    <span className="flex-shrink-0 w-14 text-xs font-medium pt-0.5" style={{ color: t.speaker === "AI" ? C.conversation : C.ink }}>
                      {t.speaker}
                    </span>
                    <span style={{ color: C.ink }}>{t.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {patient.uploadedDocuments.length > 0 && (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: C.inkFaint, letterSpacing: "0.04em" }}>
                Uploaded documents
              </div>
              <div className="space-y-1.5">
                {patient.uploadedDocuments.map((d) => {
                  const low = d.ocrConfidence < 0.75;
                  return (
                    <div
                      key={d.id}
                      className="flex items-center justify-between gap-3 rounded-md px-3 py-2"
                      style={{ background: C.bg }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText size={14} style={{ color: C.document, flexShrink: 0 }} />
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate" style={{ color: C.ink }}>
                            {d.fileName}
                          </div>
                          <div className="text-xs" style={{ color: C.inkMuted }}>
                            {d.type} · uploaded {d.uploadedAt}
                          </div>
                        </div>
                      </div>
                      <span
                        className="flex-shrink-0 text-xs font-mono rounded-full px-2 py-0.5"
                        style={{
                          fontFamily: "'IBM Plex Mono', monospace",
                          color: low ? C.review : C.verified,
                          background: low ? C.reviewBg : C.verifiedBg,
                        }}
                      >
                        {Math.round(d.ocrConfidence * 100)}% OCR
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  Doctor notes editor                                                    */
/* ---------------------------------------------------------------------- */

function DoctorNotesEditor({ notes, onAdd }) {
  const [draft, setDraft] = useState("");
  return (
    <Section title="Clinical notes">
      {notes.length > 0 && (
        <div className="space-y-2 mb-3">
          {notes.map((n, i) => (
            <div key={i} className="rounded-md p-2.5" style={{ background: C.bg }}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold" style={{ color: C.doctor }}>
                  Dr. — {n.time}
                </span>
              </div>
              <p className="text-sm mt-1" style={{ color: C.ink }}>
                {n.text}
              </p>
            </div>
          ))}
        </div>
      )}
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Add a clinical note…"
        rows={2}
        className="w-full rounded-md p-2 text-sm outline-none resize-none"
        style={{ border: `1px solid ${C.line}`, color: C.ink }}
      />
      <button
        onClick={() => {
          if (!draft.trim()) return;
          onAdd(draft.trim());
          setDraft("");
        }}
        className="mt-2 rounded-md px-3 py-1.5 text-xs font-medium text-white"
        style={{ background: C.ink }}
      >
        Add note
      </button>
    </Section>
  );
}

/* ---------------------------------------------------------------------- */
/*  Patient detail                                                         */
/* ---------------------------------------------------------------------- */

function PatientDetail({ patient, onBack, onUpdate }) {
  const setField = (field, val) => onUpdate(patient.patientId, (p) => ({ ...p, [field]: val }));

  const editListItem = (field, index, primaryKey, secondaryFmt) => (newPrimary, newSecondary) => {
    onUpdate(patient.patientId, (p) => {
      const list = [...p[field]];
      const item = { ...list[index], [primaryKey]: newPrimary, source: "doctor" };
      delete item.confidence;
      if (secondaryFmt) secondaryFmt(item, newSecondary);
      list[index] = item;
      return { ...p, [field]: list };
    });
  };

  const approve = () => {
    onUpdate(patient.patientId, (p) => ({ ...p, reviewed: true, flags: p.flags.filter((f) => f.type === "urgent") }));
  };

  const addNote = (text) => {
    onUpdate(patient.patientId, (p) => ({
      ...p,
      notes: [...p.notes, { text, time: "just now" }],
    }));
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm mb-4"
          style={{ color: C.inkMuted }}
        >
          <ArrowLeft size={15} /> Back to queue
        </button>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1
              className="text-2xl font-semibold"
              style={{ fontFamily: "'Source Serif 4', serif", color: C.ink }}
            >
              {patient.patientName}
            </h1>
            <div className="flex items-center gap-3 mt-1 text-sm" style={{ color: C.inkMuted }}>
              <span>DOB {patient.dateOfBirth}</span>
              <span>·</span>
              <span>Updated {patient.lastUpdated}</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              {patient.source.fromConversation && <SourceBadge source="conversation" />}
              {patient.source.fromDocuments && <SourceBadge source="document" />}
              {patient.reviewed && <SourceBadge source="doctor" />}
            </div>
          </div>

          {!patient.reviewed ? (
            <button
              onClick={approve}
              className="inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-sm font-medium text-white flex-shrink-0"
              style={{ background: C.verified }}
            >
              <ClipboardCheck size={15} /> Approve history
            </button>
          ) : (
            <span
              className="inline-flex items-center gap-1.5 rounded-md px-3.5 py-2 text-sm font-medium"
              style={{ background: C.verifiedBg, color: C.verified }}
            >
              <ShieldCheck size={15} /> Reviewed
            </span>
          )}
        </div>

        {patient.flags.length > 0 && (
          <div className="space-y-2 mt-5">
            {patient.flags.map((f, i) => (
              <FlagChip key={i} flag={f} />
            ))}
          </div>
        )}

        <div className="space-y-4 mt-5">
          <Section title="Chief complaint">
            <EditableBlock
              label=""
              value={patient.chiefComplaint}
              placeholder="No chief complaint captured yet."
              onSave={(v) => setField("chiefComplaint", v)}
            />
          </Section>

          <Section title="AI summary" empty={!patient.aiSummary ? "No AI summary — intake completed via document upload only." : null}>
            {patient.aiSummary && (
              <p className="text-sm leading-relaxed" style={{ color: C.ink }}>
                {patient.aiSummary}
              </p>
            )}
          </Section>

          <Section title="Symptoms" empty={patient.symptoms.length === 0 ? "None recorded." : null}>
            {patient.symptoms.map((s, i) => (
              <EditableRow
                key={i}
                primary={s.name}
                secondary={[s.onset, s.severity, s.notes].filter(Boolean).join(" · ")}
                source={s.source}
                confidence={s.confidence}
                onVerify={editListItem("symptoms", i, "name", (item, sec) => (item.notes = sec))}
              />
            ))}
          </Section>

          <Section title="Medications" empty={patient.medications.length === 0 ? "None recorded." : null}>
            {patient.medications.map((m, i) => (
              <EditableRow
                key={i}
                primary={m.name}
                secondary={[m.dosage, m.frequency].filter(Boolean).join(" · ")}
                source={m.source}
                confidence={m.confidence}
                onVerify={editListItem("medications", i, "name", (item, sec) => {
                  const [dosage, frequency] = sec.split("·").map((s) => s.trim());
                  item.dosage = dosage;
                  item.frequency = frequency;
                })}
              />
            ))}
          </Section>

          <Section title="Allergies" empty={patient.allergies.length === 0 ? "None recorded." : null}>
            {patient.allergies.map((a, i) => (
              <EditableRow
                key={i}
                primary={a.substance}
                secondary={a.reaction}
                source={a.source}
                confidence={a.confidence}
                onVerify={editListItem("allergies", i, "substance", (item, sec) => (item.reaction = sec))}
              />
            ))}
          </Section>

          <Section title="Past conditions" empty={patient.pastConditions.length === 0 ? "None recorded." : null}>
            {patient.pastConditions.map((cnd, i) => (
              <EditableRow
                key={i}
                primary={cnd.condition}
                secondary={cnd.diagnosedDate ? `Diagnosed ${cnd.diagnosedDate}` : ""}
                source={cnd.source}
                confidence={cnd.confidence}
                onVerify={editListItem("pastConditions", i, "condition", (item, sec) => (item.diagnosedDate = sec.replace(/^Diagnosed\s*/, "")))}
              />
            ))}
          </Section>

          <SourceTimeline patient={patient} />

          <DoctorNotesEditor notes={patient.notes} onAdd={addNote} />
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  App                                                                     */
/* ---------------------------------------------------------------------- */

export default function App() {
  const [patients, setPatients] = useState(INITIAL_PATIENTS);
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const selected = patients.find((p) => p.patientId === selectedId) || null;

  const updatePatient = (id, fn) => {
    setPatients((prev) => prev.map((p) => (p.patientId === id ? fn(p) : p)));
  };

  return (
    <div
      className="h-screen w-full flex"
      style={{ background: C.bg, fontFamily: "'IBM Plex Sans', sans-serif" }}
    >
      <style>{FONT_IMPORT}</style>

      <div className="w-[340px] flex-shrink-0 h-full" style={{ background: C.surface }}>
        <PatientQueue
          patients={patients}
          selectedId={selectedId}
          onSelect={setSelectedId}
          query={query}
          setQuery={setQuery}
          filter={filter}
          setFilter={setFilter}
        />
      </div>

      <div className="flex-1 h-full min-w-0">
        {selected ? (
          <PatientDetail patient={selected} onBack={() => setSelectedId(null)} onUpdate={updatePatient} />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-xs">
              <ClipboardCheck size={28} style={{ color: C.inkFaint, margin: "0 auto 10px" }} />
              <p className="text-sm" style={{ color: C.inkMuted }}>
                Select a patient from the queue to review their structured history.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
