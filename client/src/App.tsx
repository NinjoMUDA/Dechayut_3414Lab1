import React, { useState } from "react";
import { RequesterProvider, useRequester } from "./context/RequesterContext.js";
import { Navbar } from "./components/Navbar.js";
import { RequesterSelector } from "./components/RequesterSelector.js";
import { CreateTicket } from "./components/CreateTicket.js";
import { MyTickets } from "./components/MyTickets.js";
import { checkSystem, Category, Ticket } from "./api.js";

type ViewMode = "my-tickets" | "create-ticket" | "ticket-detail";

function MainApp() {
  const { activeRequester } = useRequester();
  const [currentView, setCurrentView] = useState<ViewMode>("my-tickets");
  const [isSelectorOpen, setIsSelectorOpen] = useState<boolean>(!activeRequester);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

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

  const handleOpenTicketDetail = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setCurrentView("ticket-detail");
  };

  return (
    <div className="min-vh-100 d-flex flex-column" style={{ backgroundColor: "var(--color-page-bg)" }}>
      {/* Zen Green Navigation Header */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => {
          setCurrentView(view);
          setSelectedTicket(null);
        }}
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

        {/* Create Ticket View */}
        {currentView === "create-ticket" && (
          <CreateTicket
            onSuccessNavigate={() => setCurrentView("my-tickets")}
            onCancel={() => setCurrentView("my-tickets")}
          />
        )}

        {/* My Tickets View */}
        {currentView === "my-tickets" && (
          <MyTickets
            onCreateTicketClick={() => setCurrentView("create-ticket")}
            onSelectTicket={handleOpenTicketDetail}
          />
        )}

        {/* Ticket Detail Placeholder (To be completed in Issue 5) */}
        {currentView === "ticket-detail" && selectedTicket && (
          <div className="zen-card p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="h4 fw-bold mb-0">
                Ticket Detail: <span className="text-success font-monospace">{selectedTicket.ticketNumber}</span>
              </h2>
              <button
                className="btn btn-zen-secondary btn-sm"
                onClick={() => setCurrentView("my-tickets")}
              >
                ← Back to My Tickets
              </button>
            </div>
            <p className="lead">{selectedTicket.summary}</p>
            <p className="text-muted">{selectedTicket.description}</p>
          </div>
        )}

        {/* System Verification Section (Lab 1 & Lab 2 Connectivity) */}
        <div className="zen-card p-4 mx-auto mt-5" style={{ maxWidth: 640 }}>
          <div className="text-center mb-3">
            <h1 className="h5 fw-bold mb-1">
              TokTickIT <span className="text-success">System Status Check</span>
            </h1>
            <p className="text-muted small">Service Catalog Verification</p>
          </div>

          <div className="d-grid gap-2 mb-3">
            <button
              className="btn btn-zen-primary btn-sm shadow-sm"
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
            <div className="text-center py-2">
              <div className="spinner-border text-success spinner-border-sm" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2 text-muted small">Checking backend connectivity...</p>
            </div>
          )}

          {systemStatus === "success" && (
            <div className="card border-0 bg-light p-3 rounded-3">
              <div className="d-flex align-items-center mb-2">
                <span className="badge bg-success fs-6 me-2">● Online</span>
                <h2 className="h6 mb-0 fw-semibold text-dark">System Status: Online</h2>
              </div>
              <ul className="list-group list-group-flush rounded-3 small">
                {categories.map((cat) => (
                  <li key={cat.id} className="list-group-item d-flex justify-content-between align-items-center py-1">
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
