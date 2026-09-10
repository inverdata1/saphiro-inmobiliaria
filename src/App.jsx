import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/nav/Navbar";
import ScrollToTop from "./components/ScrollToTop";
import ProtectedRoute from "./components/routes/ProtectedRoute";
import GuestRoute from "./components/routes/GuestRoute";

import DashboardPage from "./pages/DashboardPage";
import InicioPage from "./pages/InicioPage";
import InmueblesPage from "./pages/Inmuebles/InmueblesPage";
import InmuebleDetailPage from "./pages/Inmuebles/InmuebleDetailPage";
import CrearInmueblePage from "./pages/Inmuebles/CrearInmueblePage";
import MisInmueblesPage from "./pages/Inmuebles/MisInmueblesPage";
import TransaccionesPage from "./pages/Transacciones/transaccionesPage";
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
import VerificarEmailPage from "./pages/Auth/VerificarEmailPage";
import VerificacionPendientePage from "./pages/Auth/VerificacionPendientePage";
import VerificarEmailBanner from "./components/VerificarEmailBanner";
import PasarelaPagoPage from "./pages/Pagos/PasarelaPagoPage";
import ReservationPage from "./pages/Pagos/ReservationPage";
import MisRecibosPage from "./pages/Pagos/MisRecibosPage";
import TransferenciasRecibidasPage from "./pages/Transacciones/TransferenciasRecibidasPage";
import Perfil from "./pages/perfil";
import PerfilUsuarioPage from "./pages/PerfilUsuarioPage";

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Navbar />
      <VerificarEmailBanner />
      <Routes>
        {/* ── Públicas (sin auth) ── */}
        <Route path="/" element={<InicioPage />} />
        <Route path="/inmuebles" element={<InmueblesPage />} />
        <Route path="/inmuebles/:id" element={<InmuebleDetailPage />} />
        <Route path="/perfil/:id" element={<PerfilUsuarioPage />} />
        <Route path="/usuarios/:id" element={<PerfilUsuarioPage />} />
        <Route path="/recibos" element={<MisRecibosPage />} />
        <Route path="/mis-recibos" element={<MisRecibosPage />} />

        {/* ── Guest: solo usuarios NO autenticados ── */}
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
        <Route path="/corredores/registro" element={<RegistroCorredorPage />} />
        <Route path="/administradores/registro" element={<RegistroAdminPage />} />

        {/* ── Verificación de correo ── */}
        <Route path="/verificar-email" element={<VerificarEmailPage />} />
        <Route path="/verificacion-pendiente" element={<VerificacionPendientePage />} />

        {/* ── Usuarios Autenticados (Perfil, Guardados, Notificaciones) ── */}
        <Route path="/perfil" element={<ProtectedRoute roles={["cliente", "corredor", "admin"]}><Perfil /></ProtectedRoute>} />
        <Route path="/guardados" element={<ProtectedRoute roles={["cliente", "corredor"]}><GuardadosPage /></ProtectedRoute>} />
        <Route path="/notificaciones" element={<ProtectedRoute roles={["cliente", "corredor", "admin"]}><NotificacionesPage /></ProtectedRoute>} />
        <Route path="/pagos/:inmuebleId" element={<ProtectedRoute roles={["cliente", "corredor"]}><PasarelaPagoPage /></ProtectedRoute>} />
        <Route path="/reservar/:inmuebleId" element={<ProtectedRoute roles={["cliente", "corredor"]}><ReservationPage /></ProtectedRoute>} />

        {/* ── Corredores ── */}
        <Route path="/inmuebles/crear" element={<ProtectedRoute roles={["corredor"]}><CrearInmueblePage /></ProtectedRoute>} />
        <Route path="/mis-inmuebles" element={<ProtectedRoute roles={["corredor"]}><MisInmueblesPage /></ProtectedRoute>} />
        <Route path="/mis-transferencias" element={<ProtectedRoute roles={["corredor", "admin"]}><TransferenciasRecibidasPage /></ProtectedRoute>} />
        <Route path="/transferencias-recibidas" element={<TransferenciasRecibidasPage />} />

        {/* ── Administradores ── */}
        <Route path="/dashboard" element={<ProtectedRoute roles={["admin"]}><DashboardPage /></ProtectedRoute>} />
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
