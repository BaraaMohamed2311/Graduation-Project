"use client";

import { jsPDF } from "jspdf";

// ─── Color palette ────────────────────────────────────────────────────────────
const C = {
  primary:      [0,   74,  124],
  primaryLight: [0,   104, 174],
  accent:       [0,   160, 160],
  rowEven:      [240, 247, 253],
  rowOdd:       [255, 255, 255],
  sectionBg:    [224, 238, 249],
  border:       [180, 210, 235],
  textDark:     [20,  30,  48],
  textMid:      [80,  100, 130],
  textLight:    [130, 150, 175],
  white:        [255, 255, 255],
};

// Internal keys to never display
const SKIP = new Set(["_id", "__v", "user_id"]);

// Section display labels — extend to match your data shape
const SECTION_LABELS = {
  main:         "Patient Information",
  healthStatus: "Health Status",
  patientMeds:  "Medications & Schedule",
};

function fmtKey(k) {
  return k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function fmtVal(v) {
  if (v == null || v === "null" || v === "undefined" || v === "") return "—";
  const s = String(v);
  // ISO date → human readable
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) {
    return new Date(s).toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    });
  }
  return s;
}

export default function ExportPdfButton({ data, filename = "patient-report.pdf" }) {

  const handleExport = () => {
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const PW  = doc.internal.pageSize.getWidth();   // 210
    const PH  = doc.internal.pageSize.getHeight();  // 297
    const ML  = 14, MR = 14;
    const CW  = PW - ML - MR;

    let y = 0;
    let pageNum = 1;

    // ── Drawing helpers ───────────────────────────────────────────────────
    const sf = (col) => doc.setFillColor(...col);
    const ss = (col) => doc.setDrawColor(...col);
    const st = (col) => doc.setTextColor(...col);

    // ── Footer ────────────────────────────────────────────────────────────
    function footer() {
      const fy = PH - 8;
      ss(C.border);
      doc.setLineWidth(0.3);
      doc.line(ML, fy - 3, PW - MR, fy - 3);
      doc.setFontSize(7);
      doc.setFont("helvetica", "normal");
      st(C.textLight);
      doc.text("CONFIDENTIAL – For authorized medical personnel only", ML, fy);
      doc.text(`Page ${pageNum}`, PW - MR, fy, { align: "right" });
    }

    // ── Running page header (pages 2+) ────────────────────────────────────
    function runningHeader() {
      sf(C.primary);
      doc.rect(0, 0, PW, 12, "F");
      sf(C.accent);
      doc.rect(0, 11, PW, 1.5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      st(C.white);
      doc.text("PATIENT MEDICAL REPORT", ML, 8);
      const pname = data?.main?.user_name || "";
      if (pname) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.text(pname, PW - MR, 8, { align: "right" });
      }
      y = 17;
    }

    // ── Add page ──────────────────────────────────────────────────────────
    function addPage() {
      footer();
      doc.addPage();
      pageNum++;
      runningHeader();
    }

    // ── Guard — add page if not enough vertical space ─────────────────────
    function guard(need) {
      if (y + need > PH - 18) addPage();
    }

    // ── Section header bar ────────────────────────────────────────────────
    function sectionHeader(label) {
      sf(C.primary);
      doc.rect(ML, y, CW, 9, "F");
      sf(C.accent);
      doc.rect(ML, y, 4, 9, "F");          // teal left accent
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      st(C.white);
      doc.text(label.toUpperCase(), ML + 9, y + 6.2);
      y += 11;
    }

    // ════════════════════════════════════════════════════════════════════
    // COVER
    // ════════════════════════════════════════════════════════════════════
    sf(C.primary);
    doc.rect(0, 0, PW, 40, "F");
    sf(C.accent);
    doc.rect(0, 37, PW, 3, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    st(C.white);
    doc.text("HOSPITAL MANAGEMENT SYSTEM", PW / 2, 14, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    st([180, 210, 240]);
    doc.text("Patient Medical Record & Health Summary", PW / 2, 22, { align: "center" });

    const today = new Date().toLocaleDateString("en-GB", {
      day: "2-digit", month: "long", year: "numeric",
    });
    doc.setFontSize(7.5);
    st([155, 195, 225]);
    doc.text(`Report generated: ${today}`, PW / 2, 29, { align: "center" });

    y = 46;

    // Patient ID strip
    const pid   = data?.main?.user_id;
    const pname = data?.main?.user_name  || "";
    const email = data?.main?.user_email || "";

    sf(C.sectionBg);
    ss(C.border);
    doc.setLineWidth(0.4);
    doc.roundedRect(ML, y, CW, 14, 2, 2, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    st(C.primary);
    doc.text(pname || `Patient #${pid}`, ML + 5, y + 6.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    st(C.textMid);
    doc.text(email, ML + 5, y + 11.5);

    if (pid) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      st(C.accent);
      doc.text(`ID: ${pid}`, PW - MR - 5, y + 9, { align: "right" });
    }
    y += 20;

    // ════════════════════════════════════════════════════════════════════
    // SECTIONS
    // ════════════════════════════════════════════════════════════════════
    Object.entries(data).forEach(([sectionKey, sectionVal]) => {
      if (!sectionVal) return;
      const label = SECTION_LABELS[sectionKey] || fmtKey(sectionKey);

      if (Array.isArray(sectionVal)) {
        renderArraySection(sectionVal, label);
      } else if (typeof sectionVal === "object") {
        renderObjectSection(sectionVal, label);
      }
    });

    footer();
    doc.save(filename);

    // ─── Object section: 2-column key/value grid ─────────────────────────
    function renderObjectSection(obj, label) {
      const entries = Object.entries(obj).filter(([k]) => !SKIP.has(k));
      if (!entries.length) return;

      guard(22);
      sectionHeader(label);

      const colW = (CW - 2) / 2;
      const rowH = 10;
      let col = 0;

      entries.forEach(([key, val], i) => {
        const x = ML + col * (colW + 2);
        if (col === 0) guard(rowH + 1);

        const even = Math.floor(i / 2) % 2 === 0;
        sf(even ? C.rowEven : C.rowOdd);
        ss(C.border);
        doc.setLineWidth(0.2);
        doc.rect(x, y, colW, rowH, "FD");

        // field label
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        st(C.textMid);
        doc.text(fmtKey(key), x + 3, y + 4);

        // field value
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        st(C.textDark);
        const fv = fmtVal(String(val));
        const maxCh = Math.floor(colW / 2) - 2;
        doc.text(fv.length > maxCh ? fv.slice(0, maxCh) + "…" : fv, x + 3, y + 8.5);

        col++;
        if (col === 2) { col = 0; y += rowH; }
      });

      if (col === 1) y += rowH;   // flush odd last row
      y += 7;
    }

    // ─── Array section: full-width table ─────────────────────────────────
    function renderArraySection(arr, label) {
      if (!arr.length) return;

      // collect unique columns
      const cols = [];
      arr.forEach((item) => {
        if (item && typeof item === "object") {
          Object.keys(item).forEach((k) => {
            if (!SKIP.has(k) && !cols.includes(k)) cols.push(k);
          });
        }
      });
      if (!cols.length) return;

      guard(22);
      sectionHeader(label);

      const colW = CW / cols.length;
      const rowH = 9;

      // thead
      guard(rowH);
      sf(C.primaryLight);
      doc.rect(ML, y, CW, rowH, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      st(C.white);
      cols.forEach((k, ci) => {
        doc.text(fmtKey(k), ML + ci * colW + 3, y + 6);
      });
      y += rowH;

      // tbody
      arr.forEach((item, ri) => {
        guard(rowH);
        sf(ri % 2 === 0 ? C.rowEven : C.rowOdd);
        ss(C.border);
        doc.setLineWidth(0.15);
        doc.rect(ML, y, CW, rowH, "FD");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        st(C.textDark);

        cols.forEach((k, ci) => {
          const raw = item?.[k];
          const fv  = fmtVal(raw != null ? String(raw) : "—");
          const maxCh = Math.floor(colW / 2) - 1;
          doc.text(fv.length > maxCh ? fv.slice(0, maxCh) + "…" : fv,
            ML + ci * colW + 3, y + 6);
        });
        y += rowH;
      });

      y += 7;
    }
  };

  // ── Button ──────────────────────────────────────────────────────────────
  return (
    <button
      onClick={handleExport}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        padding: "10px 20px",
        background: "rgb(0, 74, 124)",
        color: "#fff",
        borderRadius: "8px",
        border: "none",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: "600",
        letterSpacing: "0.3px",
        boxShadow: "0 2px 8px rgba(0,74,124,0.35)",
        transition: "opacity 0.15s",
      }}
      onMouseOver={(e) => (e.currentTarget.style.opacity = "0.88")}
      onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" strokeWidth="2.2" style={{ flexShrink: 0 }}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14,2 14,8 20,8"/>
        <line x1="12" y1="18" x2="12" y2="12"/>
        <polyline points="9,15 12,18 15,15"/>
      </svg>
      Export PDF
    </button>
  );
}