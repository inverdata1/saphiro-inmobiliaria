import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { apiGet } from "../api";
import { useAuth } from "../context/useAuth";

export default function useProfilePhotoSync() {
  const { user, updateUser } = useAuth();
  const { pathname } = useLocation();

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    apiGet(`/usuarios/${user.id}`)
      .then((res) => {
        if (cancelled) return;
        const u = res?.data || res;
        if (u && Number(u.id) === Number(user.id)) {
          const foto = u.foto_url || u.foto_perfil || user.foto_perfil;
          updateUser({
            foto_perfil: foto,
            foto_url: foto,
            avatar: u.avatar || user.avatar,
          });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, user?.id]);
}