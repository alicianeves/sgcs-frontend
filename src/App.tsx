import { useState } from "react";
import Login from "@/pages/login/login";
import PessoasPage from "@/pages/pessoas/pessoas";

function App() {
  const [usuario, setUsuario] = useState<string | null>(() => {
    if (!localStorage.getItem("token")) return null;
    return localStorage.getItem("usuarioAtual") || "Colaborador";
  });

  if (!usuario) {
    return <Login onSuccess={(nome) => setUsuario(nome)} />;
  }

  return (
    <PessoasPage
      usuarioAtual={usuario}
      onSair={() => {
        localStorage.removeItem("token");
        localStorage.removeItem("usuarioAtual");
        setUsuario(null);
      }}
    />
  );
}

export default App;
