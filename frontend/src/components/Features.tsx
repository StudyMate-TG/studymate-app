import { Calendar, ClipboardCheck, BarChart3, Bell, Users, Smartphone } from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: <Calendar className="w-10 h-10" />,
      title: "Calendário Centralizado",
      description: "Visualize todas as suas tarefas, provas e trabalhos em um calendário integrado e intuitivo."
    },
    {
      icon: <ClipboardCheck className="w-10 h-10" />,
      title: "Gestão Completa",
      description: "Registre disciplinas, horários, tarefas e acompanhe todo seu progresso acadêmico."
    },
    {
      icon: <BarChart3 className="w-10 h-10" />,
      title: "Análise de Desempenho",
      description: "Relatórios detalhados de notas, médias, presença e evolução ao longo do tempo."
    },
    {
      icon: <Bell className="w-10 h-10" />,
      title: "Alertas Inteligentes",
      description: "Receba notificações personalizadas sobre prazos, faltas e oportunidades de melhoria."
    },
    {
      icon: <Users className="w-10 h-10" />,
      title: "Compartilhe e Colabore",
      description: "Integração com redes sociais e canais digitais para estudar com amigos."
    },
    {
      icon: <Smartphone className="w-10 h-10" />,
      title: "Multiplataforma",
      description: "Acesse via app mobile (iOS e Android) ou versão web. Seus dados sempre sincronizados."
    }
  ];

  return (
    <section className="py-16 px-4 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Tudo que você precisa em um só lugar
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Ferramentas poderosas para organizar sua rotina acadêmica e alcançar seus objetivos
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-8 rounded-2xl bg-card border border-border hover:border-primary/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
            >
              <div className="text-primary mb-4 group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-card-foreground mb-3">
                {feature.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
