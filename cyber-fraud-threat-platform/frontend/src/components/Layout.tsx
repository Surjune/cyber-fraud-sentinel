import { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: "Dashboard", path: "/", icon: "📊" },
    { label: "Report Incident", path: "/report", icon: "📝" },
    { label: "History", path: "/history", icon: "📋" },
    { label: "Admin", path: "/admin", icon: "⚙️" },
  ];

  const styles = {
    container: {
      display: "flex",
      minHeight: "100vh",
      backgroundColor: "var(--bg-light)",
      fontFamily: "inherit",
    },
    sidebar: {
      width: "260px",
      backgroundColor: "var(--primary-color)",
      color: "#e2e8f0",
      padding: "24px 0",
      height: "100vh",
      position: "fixed" as const,
      overflowY: "auto" as const,
      borderRight: "1px solid rgba(255,255,255,0.1)",
      zIndex: 1000,
    },
    logo: {
      padding: "0 20px 32px",
      borderBottom: "1px solid rgba(255,255,255,0.1)",
      marginBottom: "24px",
    },
    logoTitle: {
      fontSize: "18px",
      fontWeight: "700",
      color: "#0ea5e9",
      margin: "0 0 8px 0",
      letterSpacing: "-0.5px",
    },
    logoSubtitle: {
      fontSize: "12px",
      color: "rgba(226,232,240,0.6)",
      margin: 0,
    },
    navList: {
      display: "flex",
      flexDirection: "column" as const,
      gap: "8px",
      paddingX: "12px",
    },
    navButton: (isActive: boolean) => ({
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "12px 16px",
      cursor: "pointer",
      backgroundColor: isActive ? "rgba(6, 182, 212, 0.2)" : "transparent",
      color: isActive ? "#06b6d4" : "rgba(226,232,240,0.7)",
      border: "none",
      borderRadius: "8px",
      fontSize: "14px",
      fontWeight: isActive ? "600" : "500",
      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
      borderLeft: isActive ? "3px solid #06b6d4" : "3px solid transparent",
      paddingLeft: isActive ? "13px" : "16px",
      width: "calc(100% - 12px)",
      textAlign: "left" as const,
    }),
    main: {
      marginLeft: "260px",
      flex: 1,
      backgroundColor: "var(--bg-light)",
      overflowY: "auto" as const,
    },
  };

  return (
    <div style={styles.container}>
      {/* Sidebar Navigation */}
      <nav style={styles.sidebar}>
        <div style={styles.logo}>
          <h1 style={styles.logoTitle}>🛡️ Fraud Threat</h1>
          <p style={styles.logoSubtitle}>Intelligence Platform</p>
        </div>

        <div style={{ paddingLeft: "12px", paddingRight: "12px" }}>
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={styles.navButton(location.pathname === item.path)}
            >
              <span style={{ fontSize: "18px" }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main style={styles.main}>{children}</main>
    </div>
  );
};

export default Layout;
