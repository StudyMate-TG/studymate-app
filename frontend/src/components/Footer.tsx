import logo from "@/assets/logo.png";
import { Facebook, Instagram, Twitter, Linkedin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-secondary text-secondary-foreground py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <img src={logo} alt="StudyMate" className="w-24 h-24 mb-4" />
            <p className="text-secondary-foreground/80 mb-4">
              O melhor organizador de rotina acadêmica para estudantes que querem alcançar seus objetivos.
            </p>
            <div className="flex gap-4">
              <SocialIcon icon={<Facebook className="w-5 h-5" />} />
              <SocialIcon icon={<Instagram className="w-5 h-5" />} />
              <SocialIcon icon={<Twitter className="w-5 h-5" />} />
              <SocialIcon icon={<Linkedin className="w-5 h-5" />} />
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-lg">Produto</h4>
            <ul className="space-y-2 text-secondary-foreground/80">
              <li><a href="#" className="hover:text-primary transition-colors">Funcionalidades</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Preços</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">FAQ</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Suporte</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 text-lg">Empresa</h4>
            <ul className="space-y-2 text-secondary-foreground/80">
              <li><a href="#" className="hover:text-primary transition-colors">Sobre Nós</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Carreiras</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Contato</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-secondary-foreground/20 pt-8 text-center text-secondary-foreground/60">
          <p>© 2024 StudyMate. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

const SocialIcon = ({ icon }: { icon: React.ReactNode }) => (
  <a
    href="#"
    className="w-10 h-10 rounded-full bg-secondary-foreground/10 hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-all hover:scale-110"
  >
    {icon}
  </a>
);

export default Footer;
