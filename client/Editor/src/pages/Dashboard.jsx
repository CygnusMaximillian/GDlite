import { useEffect, useState } from "react";
import { apiRequest } from "../api";
import { useNavigate } from "react-router-dom";
import { logout } from "../utils/auth";
import "./Dashboard.css";

export default function Dashboard() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  const userEmail = localStorage.getItem("userEmail") || "User";

  useEffect(() => {
    fetchDocs();
  }, []);

  async function fetchDocs() {
    setLoading(true);
    try {
      const data = await apiRequest("/document/shared/me", "GET");
      setDocs(data);
    } catch (err) {
      console.error("Failed to load documents", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleNewDoc() {
    setCreating(true);
    try {
      await apiRequest("/document/", "POST", {});
      await fetchDocs();
    } catch (err) {
      alert("Failed to create document.");
    } finally {
      setCreating(false);
    }
  }

  function openDoc(doc) {
    navigate(`/editor/${doc.owner_id}/${doc.id}`);
  }

  function handleLogout() {
    logout();
  }

  const myDocs = docs.filter((d) => d.role === "owner");
  const sharedDocs = docs.filter((d) => d.role !== "owner");

  return (
    <div className="dash-page">
      <header className="dash-header">
        <div className="dash-header-left">
          <span className="dash-logo">📝</span>
          <span className="dash-brand">GDLite</span>
        </div>
        <div className="dash-header-right">
          <span className="dash-user">{userEmail}</span>
          <button className="btn-ghost" onClick={handleLogout}>Sign out</button>
        </div>
      </header>

      <main className="dash-main">
        <div className="dash-section-header">
          <h2>My Documents</h2>
          <button className="btn-primary" onClick={handleNewDoc} disabled={creating}>
            {creating ? "Creating..." : "+ New Document"}
          </button>
        </div>

        {loading ? (
          <div className="dash-empty">Loading your documents...</div>
        ) : myDocs.length === 0 ? (
          <div className="dash-empty">
            <p>No documents yet.</p>
            <button className="btn-primary" onClick={handleNewDoc} disabled={creating}>
              Create your first document
            </button>
          </div>
        ) : (
          <div className="doc-grid">
            {myDocs.map((doc) => (
              <DocCard key={doc.id} doc={doc} onClick={() => openDoc(doc)} />
            ))}
          </div>
        )}

        {sharedDocs.length > 0 && (
          <>
            <div className="dash-section-header" style={{ marginTop: "40px" }}>
              <h2>Shared with me</h2>
            </div>
            <div className="doc-grid">
              {sharedDocs.map((doc) => (
                <DocCard key={doc.id} doc={doc} onClick={() => openDoc(doc)} shared />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function DocCard({ doc, onClick, shared }) {
  const preview = doc.content?.trim().slice(0, 80) || "Empty document";
  const date = new Date(doc.created_at).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

  return (
    <div className="doc-card" onClick={onClick}>
      <div className="doc-card-preview">{preview}</div>
      <div className="doc-card-footer">
        <div className="doc-card-meta">
          <span className="doc-card-date">{date}</span>
          {shared && <span className="doc-card-owner">by {doc.owner_email}</span>}
        </div>
        <span className={`doc-role role-${doc.role}`}>{doc.role}</span>
      </div>
    </div>
  );
}
