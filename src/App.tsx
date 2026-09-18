import { useState } from "react";
import SistemaLayout from "@/components/layout/SistemaLayout";
import Login from "@/pages/login/login";
import PessoasPage from "@/pages/pessoas/pessoas";
import { perfilDoToken } from "@/services/authService";

function App() {
  const [paginaKey, setPaginaKey] = useState(0);
  const [usuario, setUsuario] = useState<string | null>(() => {
    if (!localStorage.getItem("token")) return null;
    return localStorage.getItem("usuarioAtual") || "Colaborador";
  });

  if (!usuario) {
    return <Login onSuccess={(nome) => setUsuario(nome)} />;
  }

  const perfil = perfilDoToken(localStorage.getItem("token"));
  return (
    <SistemaLayout
      usuarioAtual={usuario}
      perfilAtual={perfil}
      onPessoas={() => { setPaginaKey((valor) => valor + 1); window.scrollTo(0, 0); }}
      onSair={() => {
        localStorage.removeItem("token");
        localStorage.removeItem("usuarioAtual");
        setUsuario(null);
      }}
    >
      <PessoasPage key={paginaKey} usuarioAtual={usuario} podeGerenciarAcesso={perfil === "Administrador"} />
    </SistemaLayout>
  );
}

export default App;
