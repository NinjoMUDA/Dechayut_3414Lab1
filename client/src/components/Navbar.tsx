import React from "react";
import { useAuth } from "../context/AuthContext.js";
import { useRequester } from "../context/RequesterContext.js";

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenSelector?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenSelector,
}) => {
  const { user, logout } = useAuth();
  const { activeRequester } = useRequester();

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "ADMIN":
        return <span className="badge bg-warning text-dark ms-2">Administrator</span>;
      case "IT_STAFF":
        return <span className="badge bg-info text-dark ms-2">IT Staff</span>;
      default:
        return <span className="badge bg-light text-success ms-2">Requester</span>;
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark zen-header shadow-sm py-2" style={{ backgroundColor: "#006B3C" }}>
      <div className="container-fluid px-3 px-md-4">
        {/* Brand */}
        <a
          className="navbar-brand fw-bold d-flex align-items-center me-4"
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            if (user?.role === "IT_STAFF") {
              onNavigate("staff-queue");
            } else if (user?.role === "ADMIN") {
              onNavigate("user-admin");
            } else {
              onNavigate("my-tickets");
            }
          }}
        >
          <span className="me-2 fs-5">🎫</span>
          <span>TokTickIT</span>
        </a>

        {/* Navigation Links based on Role */}
        <div className="d-flex align-items-center flex-grow-1">
          <ul className="navbar-nav me-auto mb-0 d-flex flex-row gap-2">
            {(!user || user.role === "REQUESTER") && (
              <>
                <li className="nav-item">
                  <button
                    className={`nav-link btn btn-link text-decoration-none px-3 py-1 ${
                      currentView === "my-tickets" ? "active fw-semibold text-white border-bottom border-2" : "text-white-50"
                    }`}
                    onClick={() => onNavigate("my-tickets")}
                  >
                    📋 My Tickets
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link btn btn-link text-decoration-none px-3 py-1 ${
                      currentView === "create-ticket" ? "active fw-semibold text-white border-bottom border-2" : "text-white-50"
                    }`}
                    onClick={() => onNavigate("create-ticket")}
                  >
                    ➕ Create Ticket
                  </button>
                </li>
              </>
            )}

            {user?.role === "IT_STAFF" && (
              <li className="nav-item">
                <button
                  className={`nav-link btn btn-link text-decoration-none px-3 py-1 ${
                    currentView === "staff-queue" ? "active fw-semibold text-white border-bottom border-2" : "text-white-50"
                  }`}
                  onClick={() => onNavigate("staff-queue")}
                >
                  📥 My Queue
                </button>
              </li>
            )}

            {user?.role === "ADMIN" && (
              <>
                <li className="nav-item">
                  <button
                    className={`nav-link btn btn-link text-decoration-none px-3 py-1 ${
                      currentView === "user-admin" ? "active fw-semibold text-white border-bottom border-2" : "text-white-50"
                    }`}
                    onClick={() => onNavigate("user-admin")}
                  >
                    👥 User Management
                  </button>
                </li>
                <li className="nav-item">
                  <button
                    className={`nav-link btn btn-link text-decoration-none px-3 py-1 ${
                      currentView === "staff-queue" ? "active fw-semibold text-white border-bottom border-2" : "text-white-50"
                    }`}
                    onClick={() => onNavigate("staff-queue")}
                  >
                    📥 Ticket Queue
                  </button>
                </li>
              </>
            )}
          </ul>

          {/* User Profile Area */}
          <div className="d-flex align-items-center ms-auto gap-3">
            {user ? (
              <div className="d-flex align-items-center gap-2">
                <div className="d-flex align-items-center text-white px-3 py-1 rounded-pill" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
                  <span className="me-1">👤</span>
                  <span className="fw-medium small">{user.name}</span>
                  {getRoleBadge(user.role)}
                </div>
                <button
                  className="btn btn-outline-light btn-sm rounded-pill px-3"
                  onClick={logout}
                  aria-label="Log out"
                >
                  Log out
                </button>
              </div>
            ) : activeRequester ? (
              <div className="dropdown">
                <button
                  className="btn btn-outline-light btn-sm d-flex align-items-center gap-2 rounded-pill px-3"
                  type="button"
                  onClick={onOpenSelector}
                >
                  <span className="badge bg-white text-success rounded-circle p-1">👤</span>
                  <span className="fw-medium">{activeRequester.name}</span>
                  <span className="small opacity-75 ms-1">▾</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
};
