import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Check, X, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import MobileHeader from "@/components/MobileHeader";

type SubjectOption = {
  id: string;
  name: string;
};

const NewAttendance = () => {
  const navigate = useNavigate();

  const [subject, setSubject] = useState("");
  const [attendance, setAttendance] = useState<"present" | "absent" | "">("");
  const [date, setDate] = useState<Date>(new Date());
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  const subjects: SubjectOption[] = [];

  const handleSubmit = () => {
    setError("");

    if (subjects.length === 0) {
      setError("Cadastre uma disciplina antes de registrar frequência.");
      return;
    }

    if (!subject) {
      setError("Selecione uma disciplina");
      return;
    }

    if (!attendance) {
      setError("Selecione presença ou falta");
      return;
    }

    const subjectName = subjects.find((item) => item.id === subject)?.name;
    const attendanceText = attendance === "present" ? "Presença" : "Falta";

    setSuccessMessage(
      `${attendanceText} registrada em ${subjectName ?? "disciplina selecionada"}!`
    );

    setShowSuccess(true);
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-background pb-20 pt-16">
        <MobileHeader title="Cadastrar Frequência" showBack />

        <div className="px-4 py-6 flex flex-col items-center justify-center min-h-[60vh] space-y-6">
          <div className="p-4 rounded-full bg-green-500/20">
            <CheckCircle2 className="w-16 h-16 text-green-500" />
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-foreground">
              Cadastro realizado com sucesso!
            </h2>

            <p className="text-muted-foreground">{successMessage}</p>
          </div>

          <Button
            onClick={() => navigate("/")}
            className="w-full max-w-xs"
            size="lg"
          >
            Voltar ao Início
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 pt-16">
      <MobileHeader title="Cadastrar Frequência" showBack />

      <div className="px-4 py-6 space-y-6">
        {/* Subject Selection */}
        <div className="space-y-2">
          <Label>Disciplina</Label>

          <Select
            value={subject}
            onValueChange={setSubject}
            disabled={subjects.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a disciplina" />
            </SelectTrigger>

            <SelectContent>
              {subjects.length === 0 ? (
                <SelectItem value="empty" disabled>
                  Nenhuma disciplina cadastrada
                </SelectItem>
              ) : (
                subjects.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          {subjects.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Cadastre uma disciplina antes de registrar frequência.
            </p>
          )}
        </div>

        {/* Date Selection */}
        <div className="space-y-2">
          <Label>Data</Label>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date
                  ? format(date, "PPP", { locale: ptBR })
                  : "Selecione uma data"}
              </Button>
            </PopoverTrigger>

            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(selectedDate) =>
                  selectedDate && setDate(selectedDate)
                }
                initialFocus
                locale={ptBR}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Attendance Options */}
        <div className="space-y-3">
          <Label>Registro</Label>

          <RadioGroup
            value={attendance}
            onValueChange={(value) =>
              setAttendance(value as "present" | "absent")
            }
          >
            <Card
              className={cn(
                "cursor-pointer transition-all",
                attendance === "present" && "border-green-500 bg-green-500/10"
              )}
              onClick={() => setAttendance("present")}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <RadioGroupItem value="present" id="present" />

                <div className="p-2 rounded-full bg-green-500/20">
                  <Check className="w-5 h-5 text-green-500" />
                </div>

                <div>
                  <p className="font-semibold">Presença</p>
                  <p className="text-sm text-muted-foreground">
                    Estive presente na aula
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card
              className={cn(
                "cursor-pointer transition-all",
                attendance === "absent" && "border-red-500 bg-red-500/10"
              )}
              onClick={() => setAttendance("absent")}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <RadioGroupItem value="absent" id="absent" />

                <div className="p-2 rounded-full bg-red-500/20">
                  <X className="w-5 h-5 text-red-500" />
                </div>

                <div>
                  <p className="font-semibold">Falta</p>
                  <p className="text-sm text-muted-foreground">
                    Não compareci à aula
                  </p>
                </div>
              </CardContent>
            </Card>
          </RadioGroup>
        </div>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        <Button
          onClick={handleSubmit}
          className="w-full"
          size="lg"
          disabled={subjects.length === 0}
        >
          Registrar Frequência
        </Button>
      </div>
    </div>
  );
};

export default NewAttendance;