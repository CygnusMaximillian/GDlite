import { useEffect, useState } from "react";
import { apiRequest } from "../api";
import { useParams } from "react-router-dom";
import {socket} from "../socket.js";

export default function Editor() {
  const { id } = useParams();

  const [content, setContent] = useState("");
  const [version, setVersion] = useState(null);
  const [docId, setDocId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");


  useEffect(() => {

    socket.auth = {
      token: localStorage.getItem("token"),
    }
    socket.connect();

    socket.on("connect_error", (err) => {
  console.log("Socket auth error:", err.message);
});

    socket.emit("join-document", {
      documentId: id,
    });

    socket.emit("request-document", {
      documentId: id,
    });
    
    return (
      ()=> {
        socket.disconnect();
      }
    )
  },[id]);

  useEffect(() => {
    socket.on("document:load", (doc) => {
      setContent(doc.content);
      setVersion(doc.version);
    });

    socket.on("document:sync", ({ content, version }) => {
      setContent(content);
      setVersion(version);
    });

    socket.on("document:reject", (latest) => {
      setContent(latest.content);
      setVersion(latest.version);
    });

    return () => {
      socket.off("document:load");
      socket.off("document:sync");
      socket.off("document:reject");
    };
  }, []);

  useEffect(() => {
    if(!docId) return;

    const timeout = setTimeout(() => {
      socket.emit("document:update", {
        documentId: docId,
        content,
        version,
      });

      return () => clearTimeout(timeout);
    },400);
  }, [content]);

  useEffect(() => {
    async function loadDocument() {
      try {
        const data = await apiRequest(`/document/${id}`,"GET");
        setDocId(data.id);
        setContent(data.content);
        setVersion(data.version);
      } catch (err) {
        setError("Failed to load document");
      }
    }

    loadDocument();
  }, [id]);

  async function handleSave() {
    setIsSaving(true);
    setError("");
    try {
      const data = await apiRequest(`/document/${docId}`, "PUT", {
        content,
        version,
      });
      console.log("data version is " , data.version);
      setContent(data.content);
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

  return (
    <div>
      <h2>Document Editor</h2>
      <p>Version: {version}</p>

      <textarea
        rows={20}
        cols={80}
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />

      <br />

      {/*<button onClick={handleSave} disabled={isSaving}>
        {isSaving ? "Saving..." : "Save"}
      </button>*/}

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
