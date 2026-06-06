import { cadastrarUsuario, loginUsuario } from "@/services/authService";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import mascot from "@/assets/mascot.png";

const Login = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const [formularioLogin, setFormularioLogin] = useState({
    email: "",
    senha: "",
  });

  const [formularioCadastro, setFormularioCadastro] = useState({
    nome: "",
    email: "",
    senha: "",
    confirmarSenha: "",
  });

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const usuario = await loginUsuario({
        email: formularioLogin.email,
        senha: formularioLogin.senha,
      });

      localStorage.setItem("studymate_current_user", JSON.stringify(usuario));

      navigate("/home");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erro ao fazer login.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (formularioCadastro.senha !== formularioCadastro.confirmarSenha) {
      alert("As senhas não conferem.");
      return;
    }

    setIsLoading(true);

    try {
      const usuario = await cadastrarUsuario({
        nome: formularioCadastro.nome,
        email: formularioCadastro.email,
        senha: formularioCadastro.senha,
      });

      localStorage.setItem("studymate_current_user", JSON.stringify(usuario));

      navigate("/home");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Erro ao cadastrar usuário.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-background to-muted/50">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center space-y-2">
          <img
            src={mascot}
            alt="StudyMate Mascote"
            className="h-24 w-24 mb-4"
          />

          <h1 className="text-3xl font-bold text-primary">StudyMate</h1>

          <p className="text-muted-foreground">
            Organize sua vida acadêmica
          </p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Entrar</TabsTrigger>
            <TabsTrigger value="signup">Cadastrar</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Bem-vindo de volta!</CardTitle>
                <CardDescription>
                  Entre com suas credenciais para continuar
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Digite seu e-mail"
                      value={formularioLogin.email}
                      onChange={(e) =>
                        setFormularioLogin({
                          ...formularioLogin,
                          email: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Digite sua senha"
                      value={formularioLogin.senha}
                      onChange={(e) =>
                        setFormularioLogin({
                          ...formularioLogin,
                          senha: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? "Entrando..." : "Entrar"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Criar conta</CardTitle>
                <CardDescription>
                  Cadastre-se para começar a organizar seus estudos
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome completo</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Digite seu nome completo"
                      value={formularioCadastro.nome}
                      onChange={(e) =>
                        setFormularioCadastro({
                          ...formularioCadastro,
                          nome: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">E-mail</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Digite seu e-mail"
                      value={formularioCadastro.email}
                      onChange={(e) =>
                        setFormularioCadastro({
                          ...formularioCadastro,
                          email: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Digite sua senha"
                      value={formularioCadastro.senha}
                      onChange={(e) =>
                        setFormularioCadastro({
                          ...formularioCadastro,
                          senha: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmar senha</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirme sua senha"
                      value={formularioCadastro.confirmarSenha}
                      onChange={(e) =>
                        setFormularioCadastro({
                          ...formularioCadastro,
                          confirmarSenha: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? "Cadastrando..." : "Cadastrar"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Login;