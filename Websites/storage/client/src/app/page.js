"use client";
import { useState, useEffect, useCallback } from "react";
import { getMeds } from "../lib/api";
import AddMedicineModal from "../components/AddMedicineModal";
import EditMedicineModal from "../components/EditMedicineModal";
import AuthGuard from "../components/AuthGuard";
import { useIsLoginContext } from "../contexts/isLogin";
import { useUserDataContext } from "../contexts/user_data";
import { useRouter } from "next/navigation";

const PAGE_SIZE = 10;

function Dashboard() {
  const router = useRouter();
  const { setIsLogin } = useIsLoginContext();
  const { user_data, setUser_Data } = useUserDataContext();

  const [meds, setMeds] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editMed, setEditMed] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const fetchMeds = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getMeds({
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
        search,
      });
      setMeds(data.meds);
      setTotal(data.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchMeds();
  }, [fetchMeds]);

  function handleSearch() {
    setPage(1);
    setSearch(searchInput);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") handleSearch();
  }

  function handleLogout() {
    setIsLogin(false);
    setUser_Data({ user_id: null, user_name: null, user_email: null, token: null });
    localStorage.removeItem("user_data");
    localStorage.removeItem("isLogin");
    router.push("/login");
  }

  const isLow = (med) => med.med_quantity <= med.med_threshold;

  return (
    <>
      <div className="layout">
        <header className="header">
          <div className="header-left">
            <div className="logo">⚕</div>
            <div>
              <h1>Medicine Inventory</h1>
              <p className="subtitle">Hospital Management System</p>
            </div>
          </div>
          <div className="header-right">
            {user_data.user_name && (
              <span className="user-label">👤 {user_data.user_name}</span>
            )}
            <button className="btn-primary" onClick={() => setShowAdd(true)}>
              + Add Medicine
            </button>
            <button className="btn-secondary" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        <main className="main">
          <div className="toolbar">
            <div className="search-wrap">
              <input
                className="search-input"
                type="text"
                placeholder="Search by medicine name…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button className="btn-secondary" onClick={handleSearch}>Search</button>
            </div>
            <span className="total-label">{total} medicine{total !== 1 ? "s" : ""} found</span>
          </div>

          {error && <div className="error-banner">{error}</div>}

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Company</th>
                  <th>Factory</th>
                  <th>To Cure</th>
                  <th>Quantity</th>
                  <th>Threshold</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} className="empty-cell">Loading…</td></tr>
                ) : meds.length === 0 ? (
                  <tr><td colSpan={9} className="empty-cell">No medicines found.</td></tr>
                ) : (
                  meds.map((med) => (
                    <tr key={med.med_id} className={isLow(med) ? "row-low" : ""}>
                      <td className="mono">{med.med_id}</td>
                      <td className="bold">{med.med_name}</td>
                      <td>{med.med_company || "—"}</td>
                      <td>{med.med_factory || "—"}</td>
                      <td>{med.toCure || "—"}</td>
                      <td className="mono">{med.med_quantity}</td>
                      <td className="mono">{med.med_threshold}</td>
                      <td>
                        <span className={`badge ${isLow(med) ? "badge-low" : "badge-ok"}`}>
                          {isLow(med) ? "Low Stock" : "OK"}
                        </span>
                      </td>
                      <td>
                        <button className="btn-edit" onClick={() => setEditMed(med)}>Edit</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="pagination">
            <button
              className="page-btn"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              ‹ Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                className={`page-btn ${p === page ? "page-active" : ""}`}
                onClick={() => setPage(p)}
              >
                {p}
              </button>
            ))}
            <button
              className="page-btn"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next ›
            </button>
          </div>
        </main>
      </div>

      {showAdd && (
        <AddMedicineModal onClose={() => setShowAdd(false)} onAdded={fetchMeds} />
      )}
      {editMed && (
        <EditMedicineModal med={editMed} onClose={() => setEditMed(null)} onUpdated={fetchMeds} />
      )}
    </>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <Dashboard />
    </AuthGuard>
  );
}
