import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import GuestRoute from "./components/GuestRoute";

import DashboardPage from "./pages/DashboardPage";
import InicioPage from "./pages/InicioPage";
import InmueblesPage from "./pages/Inmuebles/InmueblesPage";
import InmuebleDetailPage from "./pages/Inmuebles/InmuebleDetailPage";
import CrearInmueblePage from "./pages/Inmuebles/CrearInmueblePage";
import TransaccionesPage from "./pages/transaccionesPage";
import ComisionesPage from "./pages/ComisionesPage";
import CorredoresPage from "./pages/CorredoresPage";
import UsuariosAdminPage from "./pages/UsuariosAdminPage";
import RegistroAdminPage from "./pages/Auth/RegistroAdminPage";
import RegistroCorredorPage from "./pages/Auth/RegistroCorredorPage";
import BitacoraPage from "./pages/BitacoraPage";
import GuardadosPage from "./pages/GuardadosPage";
import NotificacionesPage from "./pages/NotificacionesPage";
import LoginPage from "./pages/Auth/LoginPage";
import RegisterPage from "./pages/Auth/RegisterPage";
import ForgotPasswordPage from "./pages/Auth/ForgotPasswordPage";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        {/* ── Públicas (sin auth) ── */}
        <Route path="/" element={<InicioPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/inmuebles" element={<InmueblesPage />} />
        <Route path="/inmuebles/:id" element={<InmuebleDetailPage />} />

        {/* ── Guest: solo usuarios NO autenticados ── */}
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
        <Route path="/corredores/registro" element={<RegistroCorredorPage />} />
        <Route path="/administradores/registro" element={<RegistroAdminPage />} />

        {/* ── Clientes ── */}
        <Route path="/guardados" element={<ProtectedRoute roles={["cliente", "corredor"]}><GuardadosPage /></ProtectedRoute>} />
        <Route path="/notificaciones" element={<ProtectedRoute roles={["cliente", "corredor", "admin"]}><NotificacionesPage /></ProtectedRoute>} />

        {/* ── Corredores ── */}
        <Route path="/inmuebles/crear" element={<ProtectedRoute roles={["corredor"]}><CrearInmueblePage /></ProtectedRoute>} />

        {/* ── Administradores ── */}
        <Route path="/transacciones" element={<ProtectedRoute roles={["admin"]}><TransaccionesPage /></ProtectedRoute>} />
        <Route path="/corredores" element={<ProtectedRoute roles={["admin"]}><CorredoresPage /></ProtectedRoute>} />
        <Route path="/comisiones" element={<ProtectedRoute roles={["admin"]}><ComisionesPage /></ProtectedRoute>} />
        <Route path="/administradores" element={<ProtectedRoute roles={["admin"]}><UsuariosAdminPage /></ProtectedRoute>} />
        <Route path="/bitacora" element={<ProtectedRoute roles={["admin"]}><BitacoraPage /></ProtectedRoute>} />

        {/* ── Catch-all ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
