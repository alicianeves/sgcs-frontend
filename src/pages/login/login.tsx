import { useState, type FormEvent } from "react";
import { ArrowLeft, Eye, EyeOff, Heart, LogIn, ShieldCheck, UsersRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/services/authService";

function InstitutionBrand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white p-1 shadow-sm">
        <img src="/logo.png" alt="" className="max-h-full max-w-full object-contain" />
      </div>
      <div className={compact ? "text-[#292f38]" : "text-white"}>
        <p className="text-[15px] font-semibold leading-tight">Centro Social</p>
        <p className={compact
          ? "mt-0.5 text-[13px] leading-tight text-[#606b79]"
          : "mt-0.5 text-[13px] leading-tight text-white/80"}>
          Santa Rita de Cássia
        </p>
      </div>
    </div>
  );
}

function Login() {
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");

  async function handleLogin(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      const resposta = await login({ usuario, senha });
      localStorage.setItem("token", resposta.token);
      console.log("Login realizado com sucesso");
    } catch (error) {
      console.error("Erro ao realizar login", error);
    }
  }

  return (
    <main className="flex min-h-dvh w-full">
      <section className="relative hidden min-h-dvh w-1/2 grid-rows-[minmax(0,1fr)_auto_minmax(0,1fr)] bg-[#1495D6] px-16 py-12 text-white lg:grid">
        <div className="self-start">
          <InstitutionBrand />
        </div>

        <div>
          <div className="max-w-[640px]">
            <h1 className="text-[32px] font-bold leading-[1.18] tracking-tight">
              Sistema de Gestão do Centro Social
            </h1>
            <p className="mt-5 text-base leading-relaxed text-white/85">
              Cadastros, cestas básicas, Projeto Reviver, informática, agenda e
              relatórios em um só lugar, organizados e acessíveis para a equipe.
            </p>

            <div className="mt-9 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-white/15">
                  <ShieldCheck size={19} />
                </div>
                <span className="text-[15px] font-medium">Acesso seguro e restrito</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-white/15">
                  <UsersRound size={19} />
                </div>
                <span className="text-[15px] font-medium">Gestão completa de famílias e projetos</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-white/15">
                  <Heart size={19} />
                </div>
                <span className="text-[15px] font-medium">Transparência em cada atendimento</span>
              </div>
            </div>
          </div>
        </div>

        <p className="self-end text-[13px] text-white/70">Lugar de todos • Presidente Prudente/SP</p>
      </section>

      <section className="flex min-h-dvh w-full items-center justify-center bg-[#F7F8FA] px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-[448px] lg:max-w-[520px]">
          <button
            type="button"
            className="inline-flex items-center gap-2 text-[15px] text-[#606b79] transition-colors hover:text-[#292f38]"
          >
            <ArrowLeft size={16} aria-hidden="true" />
            Voltar ao site
          </button>

          <div className="mt-8 lg:hidden">
            <InstitutionBrand compact />
          </div>

          <div className="mt-9 mb-9">
            <h2 className="text-[26px] font-bold tracking-tight text-[#292f38]">Entrar no sistema</h2>
            <p className="mt-1 text-[15px] text-[#606b79]">Acesso restrito aos colaboradores.</p>
          </div>

          <form className="space-y-4" onSubmit={handleLogin}>
            <div className="space-y-1.5">
              <Label htmlFor="usuario" className="text-[15px] font-medium text-[#292f38]">
                Usuário / e-mail
              </Label>
              <Input
                id="usuario"
                type="text"
                autoComplete="username"
                placeholder="nome@santarita.org.br"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                className="h-10 rounded-lg border-[#d9e1ea] bg-transparent px-3 text-[15px] shadow-sm placeholder:text-[#606b79] md:text-[15px]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="senha" className="text-[15px] font-medium text-[#292f38]">Senha</Label>
              <div className="relative">
                <Input
                  id="senha"
                  type={mostrarSenha ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="h-10 rounded-lg border-[#d9e1ea] bg-transparent px-3 pr-10 text-[15px] shadow-sm placeholder:text-[#606b79] md:text-[15px]"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#606b79] hover:text-[#292f38]"
                  aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                >
                  {mostrarSenha ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Checkbox id="lembrar" />
                <Label htmlFor="lembrar" className="cursor-pointer text-[15px] font-normal text-[#606b79]">
                  Lembrar acesso
                </Label>
              </div>
              <button type="button" className="text-[15px] text-[#1495D6] hover:underline">
                Esqueci minha senha
              </button>
            </div>

            <Button
              type="submit"
              className="h-10 w-full rounded-lg bg-[#1495D6] text-[15px] font-medium text-white hover:bg-[#117eb5]"
            >
              <LogIn size={16} aria-hidden="true" />
              Entrar
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}

export default Login;
