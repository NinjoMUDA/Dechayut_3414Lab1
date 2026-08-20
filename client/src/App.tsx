import React, { useState } from "react";
import { RequesterProvider, useRequester } from "./context/RequesterContext.js";
import { Navbar } from "./components/Navbar.js";
import { RequesterSelector } from "./components/RequesterSelector.js";
import { checkSystem, Category } from "./api.js";

type ViewMode = "my-tickets" | "create-ticket" | "ticket-detail";

function MainApp() {
  const { activeRequester } = useRequester();
  const [currentView, setCurrentView] = useState<ViewMode>("my-tickets");
  const [isSelectorOpen, setIsSelectorOpen] = useState<boolean>(!activeRequester);

  // Lab 1 System Status check state
  const [systemStatus, setSystemStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [categories, setCategories] = useState<Category[]>([]);
  const [errorMsg, setErrorMsg] = useState<string>("");

  async function handleCheck() {
    setSystemStatus("loading");
    setErrorMsg("");
    try {
      const res = await checkSystem();
      setCategories(res.categories);
      setSystemStatus("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "An unexpected error occurred");
      setSystemStatus("error");
    }
  }

  return (
    <div className="min-vh-100 d-flex flex-column" style={{ backgroundColor: "var(--color-page-bg)" }}>
      {/* Zen Green Navigation Header */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        onOpenSelector={() => setIsSelectorOpen(true)}
      />

      {/* Main Content Area */}
      <main className="container-fluid px-3 px-md-4 py-4 flex-grow-1" style={{ maxWidth: 1200 }}>
        {/* If no requester is selected, prompt selection */}
        {!activeRequester && (
          <div className="alert alert-warning shadow-sm mb-4 d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-2">
              <span className="fs-5">⚠️</span>
              <span>
                <strong>No Development Requester selected.</strong> Please select an active requester to access ticketing features.
              </span>
            </div>
            <button
              className="btn btn-zen-primary btn-sm"
              onClick={() => setIsSelectorOpen(true)}
            >
              Select Requester
            </button>
          </div>
        )}

        {/* Views Placeholder (To be connected in Issues 3, 4, 5) */}
        {activeRequester && (
          <div className="mb-4">
            <div className="zen-card p-4 text-center">
              <h2 className="h4 fw-bold mb-2">
                Welcome, <span className="text-success">{activeRequester.name}</span>
              </h2>
              <p className="text-muted small mb-0">
                Active Testing Requester ID: <code>#{activeRequester.id}</code> ({activeRequester.email})
              </p>
            </div>
          </div>
        )}

        {/* System Verification Section (Lab 1 & Lab 2 Connectivity) */}
        <div className="zen-card p-4 mx-auto" style={{ maxWidth: 640 }}>
          <div className="text-center mb-3">
            <h1 className="h4 fw-bold mb-1">
              TokTickIT <span className="text-success">IT Service Desk</span>
            </h1>
            <p className="text-muted small">System Status & Service Catalog Verification</p>
          </div>

          <div className="d-grid gap-2 mb-3">
            <button
              className="btn btn-zen-primary btn-lg shadow-sm"
              onClick={handleCheck}
              disabled={systemStatus === "loading"}
            >
              {systemStatus === "loading" ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Checking System...
                </>
              ) : (
                "Check System"
              )}
            </button>
          </div>

          {systemStatus === "loading" && (
            <div className="text-center py-3">
              <div className="spinner-border text-success" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2 text-muted small">Checking backend service and database connectivity...</p>
            </div>
          )}

          {systemStatus === "success" && (
            <div className="card border-0 bg-light p-3 rounded-3">
              <div className="d-flex align-items-center mb-2">
                <span className="badge bg-success fs-6 me-2">● Online</span>
                <h2 className="h6 mb-0 fw-semibold text-dark">System Status: Online</h2>
              </div>
              <p className="text-secondary small mb-2">Supported Request Categories:</p>
              <ul className="list-group list-group-flush rounded-3 small">
                {categories.map((cat) => (
                  <li key={cat.id} className="list-group-item d-flex justify-content-between align-items-center py-2">
                    <span>{cat.name}</span>
                    <span className="badge bg-secondary rounded-pill">ID: {cat.id}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {systemStatus === "error" && (
            <div className="alert alert-danger shadow-sm d-flex align-items-start" role="alert">
              <div className="me-2 fs-5">⚠️</div>
              <div>
                <h2 className="h6 mb-1 fw-bold">System Status: Offline</h2>
                <p className="mb-0 small">{errorMsg || "Unable to connect to TokTickIT API"}</p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Requester Selector Modal */}
      <RequesterSelector
        isOpen={isSelectorOpen || !activeRequester}
        onClose={() => setIsSelectorOpen(false)}
        canCancel={!!activeRequester}
      />
    </div>
  );
}

export default function App() {
  return (
    <RequesterProvider>
      <MainApp />
    </RequesterProvider>
  );
}
