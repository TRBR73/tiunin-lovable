import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [checked, setChecked] = useState(false);
  const [authed, setAuthed] = useState(false);

  const checkAdminRole = async (userId: string) => {
    const { data, error } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    return !error && data === true;
  };

  useEffect(() => {
    const verify = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const isAdmin = await checkAdminRole(session.user.id);
        setAuthed(isAdmin);
      } else {
        setAuthed(false);
      }
      setChecked(true);
    };

    verify();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const isAdmin = await checkAdminRole(session.user.id);
        setAuthed(isAdmin);
      } else {
        setAuthed(false);
      }
      setChecked(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (!checked) return null;
  return authed ? <>{children}</> : <Navigate to="/auth" replace />;
};

export default ProtectedRoute;
