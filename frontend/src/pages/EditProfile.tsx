import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MobileHeader from "@/components/MobileHeader";
import { toast } from "sonner";

const EditProfile = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    course: "",
    semester: "",
    registration: "",
    institutionalEmail: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Perfil atualizado com sucesso!");
    navigate("/profile");
  };

  return (
    <div className="min-h-screen bg-background pb-20 pt-16">
      <MobileHeader title="Editar Perfil" showBack />

      <div className="px-4 py-6">
        {/* Avatar Section */}
        <Card className="mb-6">
          <CardContent className="p-6 text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-4xl mx-auto mb-4 shadow-lg">
              👨‍🎓
            </div>

            <Button variant="outline" size="sm">
              Alterar Foto
            </Button>
          </CardContent>
        </Card>

        {/* Personal Info */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="font-bold mb-4">Informações Pessoais</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  value={formData.name}
                  placeholder="Digite seu nome completo"
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  placeholder="Digite seu e-mail"
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>

              {/* Academic Info */}
              <Card className="mt-6">
                <CardContent className="p-6">
                  <h3 className="font-bold mb-4">Informações Acadêmicas</h3>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="course">Curso</Label>
                      <Input
                        id="course"
                        value={formData.course}
                        placeholder="Digite o nome do curso"
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            course: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="semester">Semestre</Label>
                      <Input
                        id="semester"
                        value={formData.semester}
                        placeholder="Digite o semestre atual"
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            semester: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="registration">Matrícula</Label>
                      <Input
                        id="registration"
                        value={formData.registration}
                        placeholder="Digite sua matrícula"
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            registration: e.target.value,
                          })
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="institutionalEmail">
                        Email Institucional
                      </Label>
                      <Input
                        id="institutionalEmail"
                        type="email"
                        value={formData.institutionalEmail}
                        placeholder="Digite seu e-mail institucional"
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            institutionalEmail: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate("/profile")}
                >
                  Cancelar
                </Button>

                <Button type="submit" className="flex-1">
                  Salvar Alterações
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EditProfile;