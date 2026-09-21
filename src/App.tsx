import { useState } from "react";
import SistemaLayout from "@/components/layout/SistemaLayout";
import Login from "@/pages/login/login";
import PessoasPage from "@/pages/pessoas/pessoas";
import FamiliasPage from "@/pages/familias/familias";
import { buscarFamilia, type Familia } from "@/services/familiaService";
import { perfilDoToken } from "@/services/authService";

function App() {
  const [paginaKey, setPaginaKey] = useState(0);
  const [pagina, setPagina] = useState<"pessoas" | "familias">("pessoas");
  const [contextoInicial, setContextoInicial] = useState<"PESSOA" | "FAMILIA" | "IDOSA">("PESSOA");
  const [familiaEmEdicao, setFamiliaEmEdicao] = useState<Familia | null>(null);
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
      paginaAtual={pagina}
      onPessoas={() => { setPagina("pessoas"); setContextoInicial("PESSOA"); setFamiliaEmEdicao(null); setPaginaKey((valor) => valor + 1); window.scrollTo(0, 0); }}
      onFamilias={() => { setPagina("familias"); setFamiliaEmEdicao(null); window.scrollTo(0, 0); }}
      onSair={() => {
        localStorage.removeItem("token");
        localStorage.removeItem("usuarioAtual");
        setUsuario(null);
      }}
    >
      {pagina === "pessoas" ? (
        <PessoasPage
          key={paginaKey}
          usuarioAtual={usuario}
          podeGerenciarAcesso={perfil === "Administrador"}
          contextoInicial={contextoInicial}
          familiaEmEdicao={familiaEmEdicao ?? undefined}
          onConcluirContexto={() => { setPagina("familias"); setFamiliaEmEdicao(null); window.scrollTo(0, 0); }}
        />
      ) : (
        <FamiliasPage
          onNovaFamilia={() => { setContextoInicial("FAMILIA"); setFamiliaEmEdicao(null); setPagina("pessoas"); setPaginaKey((valor) => valor + 1); window.scrollTo(0, 0); }}
          onEditarFamilia={async (entrada) => { const familia = typeof entrada === "string" ? await buscarFamilia(entrada) : entrada; setContextoInicial(familia.contexto); setFamiliaEmEdicao(familia); setPagina("pessoas"); setPaginaKey((valor) => valor + 1); window.scrollTo(0, 0); }}
        />
      )}
    </SistemaLayout>
  );
}

export default App;
