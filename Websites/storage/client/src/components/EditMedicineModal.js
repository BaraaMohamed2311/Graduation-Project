"use client";
import { useState } from "react";
import { updateMed } from "../lib/api";

export default function EditMedicineModal({ med, onClose, onUpdated }) {
  const [form, setForm] = useState({
    med_quantity: med.med_quantity,
    med_threshold: med.med_threshold,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: Number(value) }));
  }

  async function handleSubmit() {
    setError("");
    setLoading(true);
    try {
      await updateMed(med.med_id, form);
      onUpdated();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit — {med.med_name}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="form-grid">
          <div className="field">
            <label>Quantity</label>
            <input type="number" name="med_quantity" value={form.med_quantity} onChange={handleChange} min={0} />
          </div>
          <div className="field">
            <label>Threshold</label>
            <input type="number" name="med_threshold" value={form.med_threshold} onChange={handleChange} min={0} />
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
