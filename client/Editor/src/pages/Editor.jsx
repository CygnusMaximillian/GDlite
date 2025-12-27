import { useEffect, useState } from "react";
import { apiRequest } from "../api";
import { useParams } from "react-router-dom";

export default function Editor() {
  const { id } = useParams();

  const [content, setContent] = useState("");
  const [version, setVersion] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDocument() {
      try {
        const data = await apiRequest(`/document/${id}`,"GET");
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
      const data = await apiRequest(`/document/${id}`, "PUT", {
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

      <button onClick={handleSave} disabled={isSaving}>
        {isSaving ? "Saving..." : "Save"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
