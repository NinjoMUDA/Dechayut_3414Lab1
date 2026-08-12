import { useState } from "react";
import { checkSystem, Category } from "./api.js";

type UiState = "idle" | "loading" | "success" | "error";

export default function App() {
  const [state, setState] = useState<UiState>("idle");
  const [categories, setCategories] = useState<Category[]>([]);
  const [errorMsg, setErrorMsg] = useState<string>("");

  async function handleCheck() {
    setState("loading");
    setErrorMsg("");
    try {
      const res = await checkSystem();
      setCategories(res.categories);
      setState("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "An unexpected error occurred");
      setState("error");
    }
  }

  return (
    <div className="container py-5" style={{ maxWidth: 640 }}>
      <header className="mb-4 text-center">
        <h1 className="h3 fw-bold">
          TokTickIT <span className="text-success">IT Service Desk</span>
        </h1>
        <p className="text-muted small">System Status & Service Catalog Verification</p>
      </header>

      <div className="d-grid gap-2 mb-4">
        <button
          className="btn btn-success btn-lg shadow-sm"
          onClick={handleCheck}
          disabled={state === "loading"}
        >
          {state === "loading" ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Checking System...
            </>
          ) : (
            "Check System"
          )}
        </button>
      </div>

      {state === "loading" && (
        <div className="text-center py-4">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Checking backend service and database connectivity...</p>
        </div>
      )}

      {state === "success" && (
        <div className="card shadow-sm border-0 bg-light">
          <div className="card-body">
            <div className="d-flex align-items-center mb-3">
              <span className="badge bg-success fs-6 me-2">● Online</span>
              <h2 className="h5 mb-0 fw-semibold text-dark">System Status: Online</h2>
            </div>
            <p className="text-secondary small mb-3">Supported Request Categories:</p>
            <ul className="list-group list-group-flush rounded-3">
              {categories.map((cat) => (
                <li key={cat.id} className="list-group-item d-flex justify-content-between align-items-center py-2 fs-6">
                  <span>{cat.name}</span>
                  <span className="badge bg-secondary rounded-pill">ID: {cat.id}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {state === "error" && (
        <div className="alert alert-danger shadow-sm d-flex align-items-start" role="alert">
          <div className="me-2 fs-5">⚠️</div>
          <div>
            <h2 className="h6 mb-1 fw-bold">System Status: Offline</h2>
            <p className="mb-0 small">{errorMsg || "Unable to connect to TokTickIT API"}</p>
          </div>
        </div>
      )}
    </div>
  );
}
