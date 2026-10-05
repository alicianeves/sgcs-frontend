import { useEffect, useState } from "react";
import SistemaLayout from "@/components/layout/SistemaLayout";
import Login from "@/pages/login/login";
import PessoasPage from "@/pages/pessoas/pessoas";
import FamiliasPage from "@/pages/familias/familias";
import { perfilDoToken } from "@/services/authService";

function App() {
  const [pagina, setPagina] = useState<"pessoas" | "familias">("pessoas");
  const [usuario, setUsuario] = useState<string | null>(() => {
    if (!localStorage.getItem("token")) return null;
    return localStorage.getItem("usuarioAtual") || "Colaborador";
  });

  useEffect(() => {
    const encerrarSessao = () => setUsuario(null);
    window.addEventListener("sgcs:unauthorized", encerrarSessao);
    return () => window.removeEventListener("sgcs:unauthorized", encerrarSessao);
  }, []);

  if (!usuario) {
    return <Login onSuccess={(nome) => setUsuario(nome)} />;
  }

  const perfil = perfilDoToken(localStorage.getItem("token"));
  return (
    <SistemaLayout
      usuarioAtual={usuario}
      perfilAtual={perfil}
      paginaAtual={pagina}
      onPessoas={() => { setPagina("pessoas"); window.scrollTo(0, 0); }}
      onFamilias={() => { setPagina("familias"); window.scrollTo(0, 0); }}
      onSair={() => {
        localStorage.removeItem("token");
        localStorage.removeItem("usuarioAtual");
        setUsuario(null);
      }}
    >
      {pagina === "pessoas" ? (
        <PessoasPage
          usuarioAtual={usuario}
          podeGerenciarAcesso={perfil === "Administrador"}
        />
      ) : (
        <FamiliasPage />
      )}
    </SistemaLayout>
  );
}

export default App;
