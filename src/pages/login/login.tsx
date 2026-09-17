import { useState } from "react";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Heart,
  LogIn,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { login } from "@/services/authService";

function Login() {
    const [mostrarSenha, setMostrarSenha] = useState(false);
    const [usuario, setUsuario] = useState("");
    const [senha, setSenha] = useState(""); 

    async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        try {
            const resposta = await login({
            usuario,
            senha,
            });

            localStorage.setItem("token", resposta.token);

            console.log("Login realizado com sucesso");
        } catch (error) {
            console.error("Erro ao realizar login", error);
        }
    }

    return (
        <main className="flex min-h-screen w-full">

        {/* LADO ESQUERDO */}
        <section className="relative hidden min-h-screen w-1/2 bg-[#1495D6] text-white lg:flex lg:flex-col">

            {/* Voltar ao site */}
            <button
            type="button"
            className="absolute left-12 top-10 flex items-center gap-2 text-sm text-white/90 hover:text-white"
            >
            <ArrowLeft size={17} />
            Voltar ao site
            </button>

            {/* Conteúdo central */}
            <div className="flex flex-1 items-center px-12">
            <div className="max-w-lg">

                <h1 className="text-[30px] font-bold leading-[1.15] tracking-tight">
                Sistema Administrativo
                <br />
                do Centro Social
                <br />
                Santa Rita de Cássia
                </h1>

                <p className="text-[15px] mt-4 max-w-lg text-base leading-relaxed text-white/85">
                Área exclusiva para funcionários e voluntários autorizados
                gerenciarem famílias, doações, projetos e muito mais.
                </p>

                {/* Benefícios */}
                <div className="mt-8 space-y-4">

                <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-white/15">
                    <ShieldCheck size={19} />
                    </div>

                    <span className="text-sm font-medium">
                    Acesso seguro e restrito
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-white/15">
                    <UsersRound size={19} />
                    </div>

                    <span className="text-sm font-medium">
                    Gestão completa de famílias e projetos
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-white/15">
                    <Heart size={19} />
                    </div>

                    <span className="text-sm font-medium">
                    Transparência em cada atendimento
                    </span>
                </div>

                </div>
            </div>
            </div>

            {/* Rodapé */}
            <p className="absolute bottom-10 left-12 text-xs text-white/70">
            Lugar de todos • Presidente Prudente/SP
            </p>

        </section>


        {/* LADO DIREITO */}
        <section className="grid min-h-screen w-full place-items-center bg-[#F7F8FA] px-6 lg:w-1/2">

            <div className="w-full max-w-[380px]">

            {/* Logo */}
            <div className="mb-3 flex justify-center">
                <img
                src="/logo.png"
                alt="Centro Social Santa Rita de Cássia"
                className="h-15 w-auto object-contain"
                />
            </div>

            {/* Cabeçalho */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight text-zinc-950">
                Entrar no sistema
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                Acesse com suas credenciais institucionais.
                </p>
            </div>

            {/* Formulário */}
            <form className="space-y-4" onSubmit={handleLogin}>

                {/* Usuário */}
                <div className="space-y-1.5">
                <Label
                    htmlFor="usuario"
                    className="text-sm font-medium text-zinc-900"
                >
                    Usuário
                </Label>

                <Input
                    id="usuario"
                    type="text"
                    /*placeholder="Usuário"*/
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    className="rounded-lg border-zinc-300 bg-transparent text-sm"
                />
                </div>

                {/* Senha */}
                <div className="space-y-1.5">

                <div className="flex items-center justify-between">
                    <Label
                    htmlFor="senha"
                    className="text-sm font-medium text-zinc-900"
                    >
                    Senha
                    </Label>
                </div>

                <div className="relative">
                    <Input
                    id="senha"
                    type={mostrarSenha ? "text" : "password"}
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    /*placeholder="Senha"*/
                    className="rounded-lg border-zinc-300 bg-transparent pr-10 text-sm"
                    />

                    <button
                    type="button"
                    onClick={() => setMostrarSenha(!mostrarSenha)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900"
                    aria-label={
                        mostrarSenha ? "Ocultar senha" : "Mostrar senha"
                    }
                    >
                    {mostrarSenha ? (
                        <EyeOff size={17} />
                    ) : (
                        <Eye size={17} />
                    )}
                    </button>
                </div>
                </div>

                {/* Lembrar acesso + Esqueci minha senha */}
                <div className="flex items-center justify-between">

                <div className="flex items-center gap-2">
                    <Checkbox id="lembrar" />

                    <Label
                    htmlFor="lembrar"
                    className="cursor-pointer text-xs font-normal text-zinc-600"
                    >
                    Lembrar acesso
                    </Label>
                </div>

                <button
                    type="button"
                    className="text-xs font-medium text-[#1495D6] hover:underline"
                >
                    Esqueci minha senha
                </button>

                </div>

                {/* Entrar */}
                <Button
                type="submit"
                className="w-full rounded-lg bg-[#1495D6] text-sm font-medium text-white hover:bg-[#117eb5]"
                >
                <LogIn size={16} />
                Entrar
                </Button>

            </form>
            </div>

        </section>

        </main>
    );
}

export default Login;