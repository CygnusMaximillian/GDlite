import { useEffect, useState, useRef } from "react";
import { apiRequest } from "../api";
import { useParams, useNavigate } from "react-router-dom";
import { socket } from "../socket.js";
import "./Editor.css";

export default function Editor() {
  const { ownerId } = useParams();
  const navigate = useNavigate();

  const [content, setContent] = useState("");
  const [version, setVersion] = useState(0);
  const [docId, setDocId] = useState(null);
  const [role, setRole] = useState(null);
  const [saveStatus, setSaveStatus] = useState("saved"); // saved | saving | error | conflict
  const [loadError, setLoadError] = useState("");

  // Share modal
  const [showShare, setShowShare] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [shareRole, setShareRole] = useState("editor");
  const [shareStatus, setShareStatus] = useState(""); // "" | loading | success | error
  const [shareMsg, setShareMsg] = useState("");

  // Active users
  const [activeUsers, setActiveUsers] = useState({});

  const saveTimeoutRef = useRef(null);
  const versionRef = useRef(0);
  const docIdRef = useRef(null);
  const roleRef = useRef(null);

  // Keep refs in sync
  useEffect(() => { versionRef.current = version; }, [version]);
  useEffect(() => { docIdRef.current = docId; }, [docId]);
  useEffect(() => { roleRef.current = role; }, [role]);

  // Socket setup
  useEffect(() => {
    socket.auth = { token: localStorage.getItem("token") };
    socket.connect();

    socket.on("connect_error", (err) => console.log("Socket error:", err.message));
    socket.emit("join-document", { ownerId });

    socket.on("user-joined", (user) =>
      setActiveUsers((prev) => ({ ...prev, [user.id]: user.email }))
    );
    socket.on("user-left", (userId) =>
      setActiveUsers((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      })
    );
    socket.on("document:sync", (data) => {
      setContent(data.content);
      if (data.version != null) setVersion(data.version);
    });

    return () => {
      socket.off("user-joined");
      socket.off("user-left");
      socket.off("document:sync");
      socket.disconnect();
    };
  }, [ownerId]);

  // Load document
  useEffect(() => {
    async function loadDocument() {
      try {
        const data = await apiRequest(`/document/${ownerId}`, "GET");
        setDocId(data.id);
        setContent(data.content || "");
        setVersion(data.version ?? 0);
        setRole(data.role);
      } catch (err) {
        if (err.status === 403) {
          setLoadError("You don't have access to this document.");
        } else if (err.status === 404) {
          setLoadError("Document not found.");
        } else {
          setLoadError("Failed to load document.");
        }
      }
    }
    loadDocument();
  }, [ownerId]);

  const handleChange = (e) => {
    if (roleRef.current === "viewer") return;
    const newContent = e.target.value;
    setContent(newContent);
    setSaveStatus("saving");
    socket.emit("document:update", { content: newContent });

    clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      handleSave(newContent);
    }, 1000);
  };

  async function handleSave(newContent) {
    if (roleRef.current === "viewer" || !docIdRef.current) return;
    try {
      const data = await apiRequest(`/document/${docIdRef.current}`, "PUT", {
        content: newContent,
        version: versionRef.current,
      });
      setVersion(data.version);
      setSaveStatus("saved");
    } catch (err) {
      if (err.status === 409) {
        setSaveStatus("conflict");
      } else {
        setSaveStatus("error");
      }
    }
  }

  async function handleShare(e) {
    e.preventDefault();
    if (!shareEmail.trim()) return;
    setShareStatus("loading");
    setShareMsg("");
    try {
      await apiRequest("/document/share", "POST", {
        documentId: docId,
        email: shareEmail.trim(),
        role: shareRole,
      });
      setShareStatus("success");
      setShareMsg(`Shared with ${shareEmail} as ${shareRole}.`);
      setShareEmail("");
    } catch (err) {
      setShareStatus("error");
      setShareMsg(err.message || "Failed to share. Make sure the email is registered.");
    }
  }

  const activeList = Object.values(activeUsers); // these are emails from socket

  if (loadError) {
    return (
      <div className="editor-error-page">
        <div className="editor-error-card">
          <span className="editor-error-icon">🔒</span>
          <h2>{loadError}</h2>
          <button className="btn-primary" onClick={() => navigate("/dashboard")}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-page">
      {/* Toolbar */}
      <header className="editor-toolbar">
        <div className="editor-toolbar-left">
          <button className="toolbar-back" onClick={() => navigate("/dashboard")} title="Back">
            ← 
          </button>
          <span className="editor-brand">📝 GDLite</span>
          <div className="save-indicator">
            {saveStatus === "saving" && <span className="status-saving">● Saving...</span>}
            {saveStatus === "saved" && <span className="status-saved">✓ Saved</span>}
            {saveStatus === "error" && <span className="status-error">✗ Save failed</span>}
            {saveStatus === "conflict" && (
              <span className="status-error">
                ⚠ Conflict —{" "}
                <button className="inline-btn" onClick={() => window.location.reload()}>
                  Reload
                </button>
              </span>
            )}
          </div>
        </div>

        <div className="editor-toolbar-right">
          {/* Active users */}
          <div className="active-users">
            {activeList.length > 0 && (
              <div className="avatars">
                {activeList.slice(0, 3).map((email) => (
                  <div key={email} className="avatar" title={email}>
                    {email[0].toUpperCase()}
                  </div>
                ))}
                {activeList.length > 3 && (
                  <div className="avatar avatar-more">+{activeList.length - 3}</div>
                )}
              </div>
            )}
          </div>

          {role && (
            <span className={`role-badge role-${role}`}>{role}</span>
          )}

          {role === "owner" && (
            <button className="btn-share" onClick={() => setShowShare(true)}>
              Share
            </button>
          )}
        </div>
      </header>

      {/* Viewer banner */}
      {role === "viewer" && (
        <div className="viewer-banner">
          👁 You're viewing this document in read-only mode.
        </div>
      )}

      {/* Editor area */}
      <div className="editor-body">
        <div className="editor-paper">
          {role === null ? (
            <div className="editor-loading">Loading document...</div>
          ) : (
            <textarea
              className="editor-textarea"
              value={content}
              onChange={handleChange}
              disabled={role === "viewer"}
              placeholder={role === "viewer" ? "" : "Start typing your document..."}
              spellCheck
              autoFocus={role !== "viewer"}
            />
          )}
        </div>
      </div>

      {/* Share modal */}
      {showShare && (
        <div className="modal-overlay" onClick={() => { setShowShare(false); setShareStatus(""); setShareMsg(""); }}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Share Document</h3>
              <button className="modal-close" onClick={() => { setShowShare(false); setShareStatus(""); setShareMsg(""); }}>✕</button>
            </div>

            <form onSubmit={handleShare} className="share-form">
              <div className="share-row">
                <input
                  type="email"
                  placeholder="Enter email address to share with"
                  value={shareEmail}
                  onChange={(e) => { setShareEmail(e.target.value); setShareMsg(""); setShareStatus(""); }}
                  autoFocus
                />
                <div className="share-row-controls">
                  <select value={shareRole} onChange={(e) => setShareRole(e.target.value)}>
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <button type="submit" className="btn-primary" disabled={shareStatus === "loading"}>
                    {shareStatus === "loading" ? "Sharing..." : "Share"}
                  </button>
                </div>
              </div>

              {shareMsg && (
                <p className={`share-msg ${shareStatus}`}>{shareMsg}</p>
              )}
            </form>

            <div className="share-hint">
              <p><strong>Editor</strong> — can read and edit</p>
              <p><strong>Viewer</strong> — can only read</p>
              <hr />
              <p className="share-link-label">Or share this link directly:</p>
              <div className="share-link-box">
                <span>{window.location.href}</span>
                <button
                  type="button"
                  className="btn-copy"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                  }}
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
