import React from "react";
import { useRequester } from "../context/RequesterContext.js";

interface NavbarProps {
  currentView: "my-tickets" | "create-ticket" | "ticket-detail";
  onNavigate: (view: "my-tickets" | "create-ticket") => void;
  onOpenSelector: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenSelector,
}) => {
  const { activeRequester } = useRequester();

  return (
    <nav className="navbar navbar-expand-lg navbar-dark zen-header shadow-sm py-2">
      <div className="container-fluid px-3 px-md-4">
        {/* Brand */}
        <a
          className="navbar-brand fw-bold d-flex align-items-center me-4"
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            onNavigate("my-tickets");
          }}
        >
          <span className="me-2 fs-5">🎫</span>
          <span>TokTickIT</span>
        </a>

        {/* Navigation Links */}
        <div className="d-flex align-items-center flex-grow-1">
          <ul className="navbar-nav me-auto mb-0 d-flex flex-row gap-2">
            <li className="nav-item">
              <button
                className={`nav-link btn btn-link text-decoration-none px-3 py-1 ${
                  currentView === "my-tickets" ? "active fw-semibold" : ""
                }`}
                onClick={() => onNavigate("my-tickets")}
              >
                📋 My Tickets
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link btn btn-link text-decoration-none px-3 py-1 ${
                  currentView === "create-ticket" ? "active fw-semibold" : ""
                }`}
                onClick={() => onNavigate("create-ticket")}
              >
                ➕ Create Ticket
              </button>
            </li>
          </ul>

          {/* User Profile & Requester Selector Trigger */}
          <div className="d-flex align-items-center ms-auto">
            {activeRequester ? (
              <div className="dropdown">
                <button
                  className="btn btn-outline-light btn-sm d-flex align-items-center gap-2 rounded-pill px-3"
                  type="button"
                  id="profileDropdown"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  onClick={onOpenSelector}
                >
                  <span className="badge bg-white text-success rounded-circle p-1">👤</span>
                  <span className="fw-medium">{activeRequester.name}</span>
                  <span className="small opacity-75 ms-1">▾</span>
                </button>
              </div>
            ) : (
              <button
                className="btn btn-light btn-sm fw-medium px-3 rounded-pill"
                onClick={onOpenSelector}
              >
                Select Requester
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
