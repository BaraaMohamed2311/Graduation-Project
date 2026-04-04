"use client";
import { useState } from "react";
import { addMed } from "../lib/api";

const EMPTY = {
  med_id: "",
  med_name: "",
  med_company: "",
  med_factory: "",
  med_quantity: 0,
  toCure: "",
  discription: "",
  med_threshold: 0,
};

export default function AddMedicineModal({ onClose, onAdded }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({
      ...f,
      [name]: name === "med_quantity" || name === "med_threshold" ? Number(value) : value,
    }));
  }

  async function handleSubmit() {
    setError("");
    setLoading(true);
    try {
      await addMed(form);
      onAdded();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const fields = [
    { name: "med_id", label: "Medicine ID", type: "text" },
    { name: "med_name", label: "Name", type: "text" },
    { name: "med_company", label: "Company", type: "text" },
    { name: "med_factory", label: "Factory", type: "text" },
    { name: "toCure", label: "To Cure", type: "text" },
    { name: "discription", label: "Description", type: "text" },
    { name: "med_quantity", label: "Quantity", type: "number" },
    { name: "med_threshold", label: "Threshold", type: "number" },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Medicine</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="form-grid">
          {fields.map(({ name, label, type }) => (
            <div key={name} className="field">
              <label>{label}</label>
              <input
                type={type}
                name={name}
                value={form[name]}
                onChange={handleChange}
                min={type === "number" ? 0 : undefined}
              />
            </div>
          ))}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? "Adding…" : "Add Medicine"}
          </button>
        </div>
      </div>
    </div>
  );
}
