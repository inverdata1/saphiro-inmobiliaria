import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";

import DashboardPage from "./pages/DashboardPage";
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
import LoginPage from "./pages/Auth/LoginPage";
import RegisterPage from "./pages/Auth/RegisterPage";
import ForgotPasswordPage from "./pages/Auth/ForgotPasswordPage";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/inmuebles" element={<InmueblesPage />} />
        <Route path="/inmuebles/crear" element={<CrearInmueblePage />} />
        <Route path="/inmuebles/:id" element={<InmuebleDetailPage />} />
        <Route path="/transacciones" element={<TransaccionesPage />} />
        <Route path="/corredores" element={<CorredoresPage />} />
        <Route path="/corredores/registro" element={<RegistroCorredorPage />} />
        <Route path="/administradores" element={<UsuariosAdminPage />} />
        <Route path="/administradores/registro" element={<RegistroAdminPage />} />
        <Route path="/comisiones" element={<ComisionesPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/guardados" element={<GuardadosPage />} />
        <Route path="/bitacora" element={<BitacoraPage />} />
      </Routes>
    </BrowserRouter>
  );
}