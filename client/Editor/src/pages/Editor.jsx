import { useEffect, useState } from "react";
import { apiRequest } from "../api";
import { useParams } from "react-router-dom";
import { socket } from "../socket.js";

export default function Editor() {
  const { id } = useParams();

  const [content, setContent] = useState("");
  const [version, setVersion] = useState(null);
  const [docId, setDocId] = useState(null);
  const [role, setRole] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [shareEmail, setShareEmail] = useState("");
  const [shareRole, setShareRole] = useState("editor");

  const [activeUsers, setActiveUsers] = useState({});

  useEffect(() => {
    socket.auth = {
      token: localStorage.getItem("token"),
    };
    socket.connect();

    socket.on("connect_error", (err) => {
      console.log("Socket auth error:", err.message);
    });

    socket.emit("join-document", { ownerId: id });

    socket.on("user-joined", (user) => {
      setActiveUsers((prev) => ({ ...prev, [user.id]: user.email }));
    });

    socket.on("user-left", (userId) => {
      setActiveUsers((prev) => {
        const newUsers = { ...prev };
        delete newUsers[userId];
        return newUsers;
      });
    });

    return () => {
      socket.off("user-joined");
      socket.off("user-left");
      socket.disconnect();
    };
  }, [id]);

  useEffect(() => {
    socket.on("document:sync", (data) => {
      setContent(data.content);
      if (data.version) setVersion(data.version);
    });

    return () => {
      socket.off("document:sync");
    };
  }, []);

  const handleChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);
    
    // Broadcast content locally
    socket.emit("document:update", { content: newContent });

    // Send a debounced save API request
    clearTimeout(window.saveTimeout);
    window.saveTimeout = setTimeout(() => {
      handleSave(newContent);
    }, 1000);
  };

  useEffect(() => {
    async function loadDocument() {
      try {
        const data = await apiRequest(`/document/${id}`, "GET");
        setDocId(data.id);
        setContent(data.content);
        setVersion(data.version);
        setRole(data.role);
      } catch (err) {
        setError("Failed to load document");
      }
    }

    loadDocument();
  }, [id]);

  async function handleSave(newContent) {
    if (role === "viewer") return;
    setIsSaving(true);
    setError("");
    try {
      const data = await apiRequest(`/document/${docId}`, "PUT", {
        content: newContent,
        version,
      });
      setVersion(data.version);
    } catch (err) {
      if (err.status === 409) {
        setError("Version conflict. Please reload.");
      } else {
        setError("Save failed");
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function handleShare() {
    try {
      await apiRequest(`/document/share`, "POST", {
        documentId: docId,
        email: shareEmail,
        role: shareRole
      });
      alert("Shared successfully!");
      setShareEmail("");
    } catch (err) {
      alert("Failed to share.");
    }
  }

  return (
    <div style={{ padding: "20px" }}>
      <h2>Document Editor</h2>
      <div style={{ marginBottom: "10px" }}>
        <strong>Your Role: </strong> {role || "Loading..."}
      </div>
      
      <div style={{ marginBottom: "10px", color: "green" }}>
        <strong>Active Users Online: </strong> 
        {Object.values(activeUsers).join(", ") || "Only you"}
      </div>

      {role === "owner" && (
        <div style={{ marginBottom: "20px", border: "1px solid #ccc", padding: "10px" }}>
          <h4>Share Document</h4>
          <input 
            type="email" 
            placeholder="User Email" 
            value={shareEmail} 
            onChange={(e) => setShareEmail(e.target.value)} 
          />
          <select value={shareRole} onChange={(e) => setShareRole(e.target.value)}>
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
          <button onClick={handleShare}>Share</button>
        </div>
      )}

      {role === "viewer" && (
        <p style={{ color: "orange" }}>You are in view-only mode.</p>
      )}

      <textarea
        rows={20}
        cols={80}
        value={content}
        onChange={handleChange}
        disabled={role === "viewer" || !role}
        style={{ width: "100%", padding: "10px", fontSize: "16px" }}
      />

      <div style={{ marginTop: "10px" }}>
        {isSaving ? "Saving..." : "All changes saved automatically"}
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
