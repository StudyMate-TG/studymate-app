import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle, Trophy, Bell } from "lucide-react";
import logo from "@/assets/logo.png";

const Hero = () => {
  return (
    <section className="min-h-screen flex items-center justify-center px-4 py-16 bg-gradient-to-br from-background via-muted/30 to-background">
      <div className="max-w-6xl mx-auto text-center space-y-8">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <img 
            src={logo} 
            alt="StudyMate Logo" 
            className="w-48 h-48 mx-auto mb-6 drop-shadow-lg"
          />
          <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-4">
            Organize sua vida acadêmica
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Centralize suas disciplinas, tarefas e notas em um só lugar. 
            Gamifique seus estudos e alcance o sucesso acadêmico!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg">
              Começar Agora
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-2">
              Ver Demonstração
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
          <FeatureCard 
            icon={<Calendar className="w-8 h-8" />}
            title="Calendário Integrado"
            description="Todas suas tarefas em um só lugar"
          />
          <FeatureCard 
            icon={<CheckCircle className="w-8 h-8" />}
            title="Gestão de Tarefas"
            description="Organize e priorize seus estudos"
          />
          <FeatureCard 
            icon={<Trophy className="w-8 h-8" />}
            title="Gamificação"
            description="Ganhe badges e evolua de nível"
          />
          <FeatureCard 
            icon={<Bell className="w-8 h-8" />}
            title="Lembretes Smart"
            description="Nunca perca um prazo importante"
          />
        </div>
      </div>
    </section>
  );
};

const FeatureCard = ({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) => (
  <div className="bg-card rounded-xl p-6 shadow-md hover:shadow-lg transition-all hover:-translate-y-1 border border-border">
    <div className="text-primary mb-3 flex justify-center">{icon}</div>
    <h3 className="font-semibold text-card-foreground mb-2">{title}</h3>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
);

export default Hero;
