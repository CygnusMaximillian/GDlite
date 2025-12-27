import { useState } from "react";
import { apiRequest } from "../api";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      const data = await apiRequest("/api/auth/register", "POST", {
        email,
        password,
      });

      localStorage.setItem("token", data.token);

      const {id} = data.user;
      console.log("User data is ",data.user , " user id is ", id);
      const docData = await apiRequest("/document/","POST", {
        owner_id : id
      })

      const docId = docData.id
      navigate(`/editor/${docId}`);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <h2>Register</h2>

      <form onSubmit={handleSubmit}>
        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button type="submit">Register</button>
      </form>

      <div>
        <div>Have Id Login Instead</div>
        <button onClick={() => navigate('/login')}>Login</button>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
