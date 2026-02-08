import { NavLink, Outlet } from 'react-router-dom';
import { Activity, BarChart3, Clock, Cpu, Home } from 'lucide-react';

export function Layout() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-icon">🧠</div>
          <div className="logo-text">
            <h1>SocialGuess</h1>
            <span>社会体系推演系统</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Home size={18} /> <span>仪表盘</span>
          </NavLink>
          <NavLink to="/analysis" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Cpu size={18} /> <span>推演分析</span>
          </NavLink>
          <NavLink to="/history" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Clock size={18} /> <span>历史记录</span>
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="version-badge">
            <Activity size={14} />
            <span>v1.0.0 · Mock Mode</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
