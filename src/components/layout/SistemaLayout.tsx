import { useState, type ReactNode } from "react";
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  UserCog,
  UsersRound,
  X,
} from "lucide-react";

type Props = {
  children: ReactNode;
  usuarioAtual: string;
  perfilAtual: string;
  onSair: () => void;
  onPessoas: () => void;
};

function Marca({ recolhida = false }: { recolhida?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white p-1">
        <img src="/logo.png" alt="" className="max-h-full max-w-full object-contain" />
      </span>
      {!recolhida && (
        <span className="min-w-0 text-left">
          <span className="block text-sm font-semibold leading-tight">Centro Social</span>
          <span className="block text-xs leading-tight text-white/75">Santa Rita de Cássia</span>
        </span>
      )}
    </div>
  );
}

function MenuAdministracao({
  recolhido,
  expandido,
  aoAlternar,
  aoSelecionar,
}: {
  recolhido: boolean;
  expandido: boolean;
  aoAlternar: () => void;
  aoSelecionar: () => void;
}) {
  return (
    <nav aria-label="Menu do sistema" className="flex-1 px-3 py-4">
      <button
        type="button"
        onClick={aoAlternar}
        title={recolhido ? "Administração" : undefined}
        aria-expanded={!recolhido && expandido}
        className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-medium text-white/90 transition-colors hover:bg-white/15 ${recolhido ? "justify-center px-2" : ""}`}
      >
        <UserCog className="size-4 shrink-0" aria-hidden="true" />
        {!recolhido && (
          <>
            <span className="flex-1">Administração</span>
            <ChevronDown className={`size-4 transition-transform ${expandido ? "rotate-180" : ""}`} aria-hidden="true" />
          </>
        )}
      </button>
      {!recolhido && expandido && (
        <div className="ml-5 mt-1 border-l border-white/25 pl-3">
          <button
            type="button"
            onClick={aoSelecionar}
            aria-current="page"
            className="flex w-full items-center gap-2.5 rounded-md bg-white/15 px-3 py-2 text-left text-sm font-medium text-white"
          >
            <UsersRound className="size-4" aria-hidden="true" />
            Pessoas
          </button>
        </div>
      )}
    </nav>
  );
}

export default function SistemaLayout({ children, usuarioAtual, perfilAtual, onSair, onPessoas }: Props) {
  const [recolhido, setRecolhido] = useState(false);
  const [mobileAberto, setMobileAberto] = useState(false);
  const [administracaoAberta, setAdministracaoAberta] = useState(true);
  const [perfilAberto, setPerfilAberto] = useState(false);
  const [notificacoesAbertas, setNotificacoesAbertas] = useState(false);

  const iniciais = usuarioAtual.trim().split(/[\s@.]+/).slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? "").join("") || "CS";

  return (
    <div className="sistema-layout flex min-h-dvh bg-[#F7F8FA] text-[#273440]">
      <aside className={`sticky top-0 hidden h-dvh shrink-0 flex-col bg-[#0d5d86] text-white transition-[width] lg:flex ${recolhido ? "w-[74px]" : "w-72"}`}>
        <div className={`flex h-16 shrink-0 items-center px-4 ${recolhido ? "justify-center px-2" : ""}`}>
          <Marca recolhida={recolhido} />
        </div>
        <MenuAdministracao
          recolhido={recolhido}
          expandido={administracaoAberta}
          aoAlternar={() => recolhido ? setRecolhido(false) : setAdministracaoAberta((valor) => !valor)}
          aoSelecionar={onPessoas}
        />
        <div className="p-3">
          <button
            type="button"
            onClick={() => setRecolhido((valor) => !valor)}
            aria-label={recolhido ? "Expandir menu" : "Recolher menu"}
            className="flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-xs text-white/75 transition-colors hover:bg-white/15 hover:text-white"
          >
            {recolhido ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
            {!recolhido && "Recolher menu"}
          </button>
        </div>
      </aside>

      {mobileAberto && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Fechar menu" onClick={() => setMobileAberto(false)} className="absolute inset-0 bg-[#273440]/45" />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-[#0d5d86] text-white">
            <div className="flex h-16 items-center justify-between px-4">
              <Marca />
              <button type="button" onClick={() => setMobileAberto(false)} aria-label="Fechar menu"><X className="size-5" /></button>
            </div>
            <MenuAdministracao
              recolhido={false}
              expandido={administracaoAberta}
              aoAlternar={() => setAdministracaoAberta((valor) => !valor)}
              aoSelecionar={() => { onPessoas(); setMobileAberto(false); }}
            />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-[#d9e1ea] bg-white px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileAberto(true)}
              aria-label="Abrir menu"
              className="rounded-md border border-[#d9e1ea] p-2 lg:hidden"
            >
              <Menu className="size-5" />
            </button>
            <span className="hidden truncate text-sm text-[#606b79] sm:block">
              Sistema de Gestão · Centro Social Santa Rita de Cássia
            </span>
            <span className="truncate text-sm font-medium sm:hidden">Centro Social</span>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => { setNotificacoesAbertas((valor) => !valor); setPerfilAberto(false); }}
                aria-label="Notificações"
                aria-expanded={notificacoesAbertas}
                className="flex size-9 items-center justify-center rounded-md text-[#606b79] hover:bg-[#eef5f9]"
              >
                <Bell className="size-5" />
              </button>
              {notificacoesAbertas && (
                <div className="absolute right-0 top-11 z-40 w-64 rounded-xl border border-[#d9e1ea] bg-white p-4 text-sm shadow-lg">
                  <p className="font-semibold">Notificações</p>
                  <p className="mt-2 text-[#606b79]">Nenhuma notificação no momento.</p>
                </div>
              )}
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => { setPerfilAberto((valor) => !valor); setNotificacoesAbertas(false); }}
                aria-label="Menu do perfil"
                aria-expanded={perfilAberto}
                className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-[#eef5f9]"
              >
                <span className="flex size-8 items-center justify-center rounded-full bg-[#1495D6] text-xs font-semibold text-white">{iniciais}</span>
                <span className="hidden max-w-36 text-left sm:block">
                  <span className="block truncate text-sm font-medium">{usuarioAtual}</span>
                  <span className="block text-xs text-[#606b79]">{perfilAtual}</span>
                </span>
                <ChevronDown className="hidden size-4 text-[#606b79] sm:block" />
              </button>
              {perfilAberto && (
                <div className="absolute right-0 top-12 z-40 w-56 rounded-xl border border-[#d9e1ea] bg-white p-1.5 text-sm shadow-lg">
                  <div className="border-b border-[#e5eaf0] px-3 py-2">
                    <p className="truncate font-medium">{usuarioAtual}</p>
                    <p className="text-xs text-[#606b79]">Centro Social</p>
                  </div>
                  <button type="button" onClick={onSair} className="mt-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-left hover:bg-[#eef5f9]">
                    <LogOut className="size-4" /> Sair
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
