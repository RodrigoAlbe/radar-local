import { Lead } from "./types";

export interface SiteSourceLink {
  kind: "website" | "instagram" | "facebook" | "linktree" | "maps";
  label: string;
  value: string;
  href: string;
}

export interface SiteContent {
  heroTitle: string;
  heroSubtitle: string;
  tagline: string;
  aboutText: string;
  aboutHighlights: string[];
  sourceBadges: string[];
  sourceLinks: SiteSourceLink[];
  secondaryCta: { label: string; href: string } | null;
  services: { name: string; description: string; icon: string }[];
  testimonials: { name: string; text: string; rating: number }[];
  faqs: { q: string; a: string }[];
  ctaText: string;
  whatsappMessage: string;
}

export interface SiteVisualTheme {
  variant: "brand" | "social" | "trusted";
  pageBackground: string;
  navBackground: string;
  glassBackground: string;
  glassStrongBackground: string;
  glassBorder: string;
  auraPrimary: string;
  auraSecondary: string;
  gridOpacity: string;
  shineOpacity: string;
  cardRadius: string;
  panelRadius: string;
}

const CATEGORY_SERVICES: Record<
  string,
  { name: string; description: string; icon: string }[]
> = {
  "Oficina mecânica": [
    { name: "Troca de Óleo", description: "Troca completa com filtro e verificação de níveis", icon: "🔧" },
    { name: "Freios", description: "Pastilhas, discos, lonas e regulagem completa", icon: "🛞" },
    { name: "Suspensão", description: "Amortecedores, molas e alinhamento", icon: "⚙️" },
    { name: "Motor", description: "Diagnóstico e reparo de motor completo", icon: "🏎️" },
    { name: "Elétrica", description: "Bateria, alternador e sistema elétrico", icon: "⚡" },
    { name: "Revisão Geral", description: "Check-up completo com relatório detalhado", icon: "📋" },
  ],
  "Autoelétrica": [
    { name: "Bateria", description: "Teste, carga e substituição de baterias", icon: "🔋" },
    { name: "Alternador", description: "Reparo e troca de alternador", icon: "⚡" },
    { name: "Motor de Arranque", description: "Diagnóstico e reparo completo", icon: "🔧" },
    { name: "Iluminação", description: "Faróis, lanternas e instalação de LED", icon: "💡" },
    { name: "Som Automotivo", description: "Instalação e manutenção de som", icon: "🔊" },
    { name: "Injeção Eletrônica", description: "Diagnóstico computadorizado", icon: "💻" },
  ],
  "Assistência técnica": [
    { name: "Diagnóstico", description: "Avaliação completa do equipamento", icon: "🔍" },
    { name: "Reparo", description: "Conserto com peças originais", icon: "🔧" },
    { name: "Manutenção Preventiva", description: "Limpeza e revisão periódica", icon: "🛡️" },
    { name: "Orçamento Grátis", description: "Avaliação sem compromisso", icon: "📋" },
    { name: "Garantia", description: "Todos os serviços com garantia", icon: "✅" },
    { name: "Atendimento Rápido", description: "Serviço ágil e eficiente", icon: "⚡" },
  ],
  "Pet shop": [
    { name: "Banho e Tosa", description: "Banho completo com produtos premium", icon: "🐕" },
    { name: "Ração e Petiscos", description: "Marcas premium e naturais", icon: "🦴" },
    { name: "Veterinário", description: "Consultas e vacinas", icon: "💉" },
    { name: "Acessórios", description: "Coleiras, camas e brinquedos", icon: "🎾" },
    { name: "Hotel Pet", description: "Hospedagem segura e confortável", icon: "🏠" },
    { name: "Delivery", description: "Entrega de produtos na sua casa", icon: "🚗" },
  ],
  "Restaurante": [
    { name: "Almoço Executivo", description: "Refeição completa com qualidade", icon: "🍽️" },
    { name: "Cardápio Variado", description: "Opções para todos os gostos", icon: "📖" },
    { name: "Delivery", description: "Pedidos para entrega rápida", icon: "🛵" },
    { name: "Eventos", description: "Espaço para confraternizações", icon: "🎉" },
    { name: "Marmitex", description: "Refeições prontas para levar", icon: "📦" },
    { name: "Sobremesas", description: "Doces artesanais e especiais", icon: "🍰" },
  ],
  "Lanchonete": [
    { name: "Lanches Artesanais", description: "Hambúrgueres e sanduíches especiais", icon: "🍔" },
    { name: "Porções", description: "Petiscos para compartilhar", icon: "🍟" },
    { name: "Bebidas", description: "Sucos naturais e milkshakes", icon: "🥤" },
    { name: "Combos", description: "Promoções especiais todo dia", icon: "⭐" },
    { name: "Delivery", description: "Peça sem sair de casa", icon: "🛵" },
    { name: "Açaí", description: "Açaí e açaí na tigela", icon: "🫐" },
  ],
  "Padaria": [
    { name: "Pães Artesanais", description: "Feitos fresquinhos todo dia", icon: "🍞" },
    { name: "Confeitaria", description: "Bolos e tortas sob encomenda", icon: "🎂" },
    { name: "Café da Manhã", description: "Mesa farta e completa", icon: "☕" },
    { name: "Salgados", description: "Coxinha, esfiha, empada e mais", icon: "🥐" },
    { name: "Frios e Laticínios", description: "Produtos selecionados", icon: "🧀" },
    { name: "Encomendas", description: "Bolos e salgados para festas", icon: "🎉" },
  ],
  "Salão de beleza": [
    { name: "Corte Feminino", description: "Cortes modernos e personalizados", icon: "✂️" },
    { name: "Coloração", description: "Mechas, luzes e tintura completa", icon: "🎨" },
    { name: "Manicure e Pedicure", description: "Unhas em gel, fibra e esmaltação", icon: "💅" },
    { name: "Escova e Penteados", description: "Para o dia a dia ou eventos", icon: "💇" },
    { name: "Tratamentos", description: "Hidratação, cauterização e botox", icon: "✨" },
    { name: "Maquiagem", description: "Social e para eventos especiais", icon: "💄" },
  ],
  "Barbearia": [
    { name: "Corte Masculino", description: "Degradê, navalhado e social", icon: "✂️" },
    { name: "Barba", description: "Modelagem, alinhamento e toalha quente", icon: "🧔" },
    { name: "Sobrancelha", description: "Design masculino de sobrancelha", icon: "👁️" },
    { name: "Combo Completo", description: "Corte + barba + sobrancelha", icon: "⭐" },
    { name: "Pigmentação", description: "Coloração e disfarce de grisalhos", icon: "🎨" },
    { name: "Tratamento Capilar", description: "Hidratação e fortalecimento", icon: "💈" },
  ],
  "Academia": [
    { name: "Musculação", description: "Aparelhos modernos e acompanhamento", icon: "💪" },
    { name: "Funcional", description: "Treinos dinâmicos e variados", icon: "🏋️" },
    { name: "Spinning", description: "Aulas de bike com energia total", icon: "🚴" },
    { name: "Avaliação Física", description: "Análise completa e plano personalizado", icon: "📊" },
    { name: "Personal Trainer", description: "Acompanhamento individual", icon: "👤" },
    { name: "Zumba e Dança", description: "Aulas coletivas animadas", icon: "💃" },
  ],
  "Clínica odontológica": [
    { name: "Limpeza", description: "Profilaxia e remoção de tártaro", icon: "🦷" },
    { name: "Restauração", description: "Tratamento de cáries", icon: "🔧" },
    { name: "Clareamento", description: "Sorriso mais branco e bonito", icon: "✨" },
    { name: "Ortodontia", description: "Aparelhos fixos e alinhadores", icon: "😁" },
    { name: "Implante", description: "Implantes dentários modernos", icon: "🏥" },
    { name: "Emergência", description: "Atendimento de urgência", icon: "🚨" },
  ],
  "Clínica veterinária": [
    { name: "Consulta", description: "Atendimento clínico completo", icon: "🐾" },
    { name: "Vacinas", description: "Calendário completo de vacinação", icon: "💉" },
    { name: "Cirurgia", description: "Procedimentos com equipe especializada", icon: "🏥" },
    { name: "Exames", description: "Laboratório e diagnóstico por imagem", icon: "🔬" },
    { name: "Emergência 24h", description: "Plantão para urgências", icon: "🚨" },
    { name: "Castração", description: "Procedimento seguro e humanitário", icon: "🐕" },
  ],
  "Vidraçaria": [
    { name: "Box para Banheiro", description: "Box temperado e sob medida", icon: "🚿" },
    { name: "Espelhos", description: "Espelhos decorativos e sob medida", icon: "🪞" },
    { name: "Janelas e Portas", description: "Esquadrias em vidro temperado", icon: "🪟" },
    { name: "Fachadas", description: "Fachadas comerciais em vidro", icon: "🏢" },
    { name: "Manutenção", description: "Troca e reparo de vidros", icon: "🔧" },
    { name: "Película", description: "Películas de proteção e privacidade", icon: "🛡️" },
  ],
  "Serralheria": [
    { name: "Portões", description: "Portões automáticos e manuais", icon: "🚪" },
    { name: "Grades", description: "Grades de proteção e decorativas", icon: "🏠" },
    { name: "Estruturas Metálicas", description: "Coberturas e mezaninos", icon: "🏗️" },
    { name: "Escadas", description: "Escadas metálicas sob medida", icon: "🪜" },
    { name: "Corrimãos", description: "Corrimãos em aço e ferro", icon: "✨" },
    { name: "Manutenção", description: "Reparo e pintura de estruturas", icon: "🔧" },
  ],
  "Lavanderia": [
    { name: "Lavagem Comum", description: "Roupas do dia a dia", icon: "👕" },
    { name: "Lavagem a Seco", description: "Peças delicadas e especiais", icon: "✨" },
    { name: "Edredons e Cortinas", description: "Peças grandes e volumosas", icon: "🛏️" },
    { name: "Passadoria", description: "Roupas impecáveis e bem passadas", icon: "👔" },
    { name: "Delivery", description: "Buscamos e entregamos na sua casa", icon: "🚗" },
    { name: "Urgente", description: "Serviço express em até 24h", icon: "⚡" },
  ],
  "Loja de roupas": [
    { name: "Moda Feminina", description: "Tendências da estação", icon: "👗" },
    { name: "Moda Masculina", description: "Estilo e conforto", icon: "👔" },
    { name: "Acessórios", description: "Bolsas, cintos e bijuterias", icon: "👜" },
    { name: "Promoções", description: "Ofertas especiais toda semana", icon: "🏷️" },
    { name: "Novidades", description: "Coleções novas toda semana", icon: "✨" },
    { name: "Provador Virtual", description: "Monte seu look online", icon: "📱" },
  ],
  "Floricultura": [
    { name: "Buquês", description: "Arranjos para todas as ocasiões", icon: "💐" },
    { name: "Plantas", description: "Mudas, vasos e suculentas", icon: "🌿" },
    { name: "Cestas", description: "Cestas de café da manhã e presentes", icon: "🎁" },
    { name: "Decoração", description: "Eventos, casamentos e festas", icon: "🎉" },
    { name: "Coroas", description: "Homenagens e condolências", icon: "🕊️" },
    { name: "Entrega", description: "Entrega rápida na região", icon: "🚗" },
  ],
};

const DEFAULT_SERVICES = [
  { name: "Atendimento Especializado", description: "Equipe qualificada e experiente", icon: "⭐" },
  { name: "Qualidade Garantida", description: "Serviço com excelência e garantia", icon: "✅" },
  { name: "Orçamento Grátis", description: "Avaliação sem compromisso", icon: "📋" },
  { name: "Atendimento Rápido", description: "Agilidade no seu atendimento", icon: "⚡" },
  { name: "Localização Conveniente", description: "Fácil acesso na sua região", icon: "📍" },
  { name: "Preço Justo", description: "Melhor custo-benefício da região", icon: "💰" },
];

const CATEGORY_ABOUT: Record<string, string> = {
  "Oficina mecânica": "Somos uma oficina mecânica comprometida com a qualidade e segurança do seu veículo. Com profissionais experientes e equipamentos modernos, oferecemos serviços completos de manutenção preventiva e corretiva.",
  "Autoelétrica": "Especialistas em sistema elétrico automotivo, combinamos experiência técnica com equipamentos de diagnóstico de última geração para resolver qualquer problema elétrico do seu veículo.",
  "Pet shop": "Amamos os pets tanto quanto você! Oferecemos os melhores produtos e serviços para garantir saúde, bem-estar e felicidade para o seu companheiro de quatro patas.",
  "Restaurante": "Preparamos cada prato com ingredientes frescos e muito carinho. Nosso compromisso é proporcionar uma experiência gastronômica memorável em um ambiente acolhedor.",
  "Lanchonete": "Lanches feitos na hora com ingredientes selecionados. Nosso objetivo é oferecer sabor, qualidade e atendimento rápido para o seu dia a dia.",
  "Padaria": "Tradição e sabor em cada mordida. Produzimos diariamente pães artesanais, doces e salgados com receitas que conquistam paladares há anos.",
  "Salão de beleza": "Seu espaço de beleza e bem-estar. Nossa equipe de profissionais qualificados está pronta para realçar sua beleza com técnicas modernas e produtos de primeira linha.",
  "Barbearia": "Mais do que um corte, uma experiência. Combinamos tradição e modernidade para oferecer o melhor em cuidado masculino, em um ambiente descontraído.",
  "Academia": "Seu corpo merece o melhor. Oferecemos estrutura completa, profissionais qualificados e um ambiente motivador para você alcançar seus objetivos.",
  "Clínica odontológica": "Cuidamos do seu sorriso com excelência. Nossa equipe utiliza tecnologia de ponta para oferecer tratamentos eficazes, seguros e confortáveis.",
  "Clínica veterinária": "Cuidamos de quem você ama. Nossa equipe veterinária oferece atendimento humanizado e tecnologia avançada para a saúde do seu pet.",
  "Vidraçaria": "Transformamos ambientes com vidro. Trabalhamos com vidros temperados, laminados e espelhos sob medida, unindo segurança, funcionalidade e design.",
  "Serralheria": "Soluções em ferro e aço sob medida. Fabricamos e instalamos estruturas metálicas com qualidade, resistência e acabamento impecável.",
  "Lavanderia": "Suas roupas em boas mãos. Utilizamos produtos de qualidade e processos cuidadosos para devolver suas peças impecáveis.",
  "Floricultura": "Flores e plantas que encantam. Criamos arranjos especiais para cada momento, com flores frescas e atendimento personalizado.",
  "Loja de roupas": "Moda e estilo para você. Selecionamos as melhores peças com as últimas tendências para que você se sinta incrível todos os dias.",
};

const DEFAULT_ABOUT = "Somos um negócio local comprometido com a qualidade e a satisfação dos nossos clientes. Com experiência e dedicação, oferecemos os melhores serviços da região.";

const CATEGORY_TAGLINES: Record<string, string> = {
  "Oficina mecânica": "Seu carro em boas mãos. Sempre.",
  "Autoelétrica": "A solução elétrica que seu carro precisa.",
  "Assistência técnica": "Consertamos. Você descansa.",
  "Pet shop": "Porque seu pet merece o melhor.",
  "Restaurante": "Sabor que marca. Experiência que volta.",
  "Lanchonete": "O lanche que você merece, na hora certa.",
  "Padaria": "Fresquinho todo dia. Tradição em cada mordida.",
  "Salão de beleza": "Sua beleza, nossa arte.",
  "Barbearia": "Estilo, atitude e precisão no corte.",
  "Academia": "Transforme seu corpo. Mude sua vida.",
  "Clínica odontológica": "Sorria com confiança.",
  "Clínica veterinária": "Quem você ama, a gente cuida.",
  "Vidraçaria": "Transparência e qualidade sob medida.",
  "Serralheria": "Ferro, aço e confiança.",
  "Lavanderia": "Roupas impecáveis sem esforço.",
  "Floricultura": "Flores que falam por você.",
  "Loja de roupas": "Vista-se de confiança.",
  "Dedetização": "Livre de pragas. De verdade.",
  "Limpeza": "Ambientes limpos, vida leve.",
  "Manutenção residencial": "Sua casa em ordem, sem dor de cabeça.",
  "Marmoraria": "Elegância esculpida em pedra.",
  "Papelaria": "Tudo para sua criatividade e organização.",
  "Loja de materiais de construção": "Construa certo. Compre aqui.",
  "Chaveiro": "Trancou? A gente resolve.",
  "Elétrica e hidráulica": "Soluções que funcionam.",
  "Contabilidade": "Seus números organizados, seu negócio seguro.",
  "Imobiliária": "O imóvel certo está aqui.",
  "Escola de idiomas": "Fale com o mundo.",
  "Estúdio de tatuagem": "Sua história na pele.",
  "Ótica": "Veja a vida com clareza.",
};

const CATEGORY_TESTIMONIALS: Record<string, { name: string; text: string; rating: number }[]> = {
  "Oficina mecânica": [
    { name: "Carlos M.", text: "Levei meu carro com um barulho estranho e resolveram no mesmo dia. Preço justo e serviço honesto. Já indiquei pra toda a família.", rating: 5 },
    { name: "Ana Paula S.", text: "Fiz a revisão completa e me explicaram tudo direitinho. Transparência total. Virei cliente fiel!", rating: 5 },
    { name: "Roberto L.", text: "Melhor oficina da região, sem dúvida. Atendimento rápido e qualidade impecável.", rating: 5 },
  ],
  "Pet shop": [
    { name: "Fernanda R.", text: "Meu cachorro adora ir lá! O banho fica perfeito e tratam os pets com muito carinho. Super recomendo.", rating: 5 },
    { name: "Lucas T.", text: "Encontro tudo que preciso pro meu gato. Produtos de qualidade e atendentes que entendem do assunto.", rating: 5 },
    { name: "Mariana G.", text: "O hotel pet me salvou nas férias. Meu dog ficou super bem cuidado. Confiança total!", rating: 5 },
  ],
  "Restaurante": [
    { name: "Juliana P.", text: "Comida caseira de verdade! O almoço executivo é imbatível. Sabor e preço justo. Vou toda semana.", rating: 5 },
    { name: "André K.", text: "Levei a família e todo mundo adorou. Ambiente agradável e atendimento nota 10.", rating: 5 },
    { name: "Patrícia M.", text: "Melhor custo-benefício da região. Comida sempre fresquinha e bem temperada.", rating: 5 },
  ],
  "Salão de beleza": [
    { name: "Camila R.", text: "Saio de lá me sentindo outra pessoa! As meninas são super talentosas e atenciosas.", rating: 5 },
    { name: "Beatriz L.", text: "Fiz mechas e ficou exatamente como eu queria. Profissionais de altíssimo nível.", rating: 5 },
    { name: "Daniela F.", text: "Ambiente lindo, atendimento impecável. Meu salão favorito, sem dúvida.", rating: 5 },
  ],
  "Barbearia": [
    { name: "Thiago R.", text: "Corte perfeito toda vez. O ambiente é muito massa e os caras são gente boa. Recomendo!", rating: 5 },
    { name: "Felipe M.", text: "Faço o combo completo todo mês. Barba alinhada, corte top. Melhor barbearia da região.", rating: 5 },
    { name: "Diego S.", text: "Achei por acaso e virei cliente fiel. Profissionalismo e resultado impecável.", rating: 5 },
  ],
  "Academia": [
    { name: "Rafael C.", text: "Equipamentos novos, profissionais que acompanham de perto. Resultados reais em pouco tempo!", rating: 5 },
    { name: "Amanda B.", text: "Ambiente motivador e turmas pequenas. Melhor academia que já frequentei.", rating: 5 },
    { name: "Bruno G.", text: "O personal me montou um treino sob medida. Evolução que nunca tive em outra academia.", rating: 5 },
  ],
};

const DEFAULT_TESTIMONIALS = [
  { name: "Maria S.", text: "Excelente atendimento! Profissionais super capacitados e serviço impecável. Já indiquei para vários amigos.", rating: 5 },
  { name: "João P.", text: "Encontrei por acaso e virei cliente fiel. Qualidade de serviço que é difícil de encontrar hoje em dia.", rating: 5 },
  { name: "Ana C.", text: "Atendimento rápido, preço justo e resultado perfeito. Melhor da região, sem dúvida!", rating: 5 },
];

const CATEGORY_FAQS: Record<string, { q: string; a: string }[]> = {
  "Oficina mecânica": [
    { q: "Vocês trabalham com agendamento?", a: "Sim! Você pode agendar pelo WhatsApp ou telefone. Também aceitamos clientes sem agendamento, sujeito à disponibilidade." },
    { q: "Fazem orçamento antes do serviço?", a: "Sempre. Fazemos um diagnóstico completo e você aprova o orçamento antes de qualquer serviço ser executado." },
    { q: "Trabalham com todas as marcas?", a: "Sim, atendemos todas as marcas e modelos de veículos, nacionais e importados." },
    { q: "Qual a garantia dos serviços?", a: "Todos os nossos serviços possuem garantia. O prazo varia conforme o tipo de reparo — informamos no momento do orçamento." },
  ],
  "Pet shop": [
    { q: "Preciso agendar o banho?", a: "Recomendamos agendar para garantir horário, mas aceitamos encaixes quando possível. Agende pelo WhatsApp!" },
    { q: "Vocês têm veterinário no local?", a: "Sim! Contamos com profissional veterinário para consultas, vacinas e orientações." },
    { q: "Fazem entrega de ração?", a: "Sim, fazemos delivery de produtos para sua comodidade. Consulte a área de entrega." },
    { q: "Aceitam animais de grande porte?", a: "Aceitamos pets de todos os tamanhos. Nossa equipe está preparada para lidar com todas as raças." },
  ],
  "Restaurante": [
    { q: "Fazem entrega (delivery)?", a: "Sim! Fazemos entrega na região. Peça pelo WhatsApp ou pelos nossos canais de atendimento." },
    { q: "Têm opções vegetarianas?", a: "Sim, nosso cardápio tem opções para todos os gostos, incluindo pratos vegetarianos e leves." },
    { q: "Aceitam reservas para grupos?", a: "Sim! Fazemos reservas para confraternizações, aniversários e eventos corporativos." },
    { q: "Qual o horário de funcionamento?", a: "Funcionamos de segunda a sábado. Consulte nossos horários atualizados entrando em contato." },
  ],
  "Salão de beleza": [
    { q: "Preciso agendar horário?", a: "Recomendamos o agendamento para garantir seu horário. Agende pelo WhatsApp de forma rápida e prática!" },
    { q: "Vocês atendem noivas?", a: "Sim! Temos pacotes especiais para noivas com cabelo, maquiagem e tratamentos completos." },
    { q: "Trabalham com produtos veganos?", a: "Trabalhamos com diversas linhas, incluindo opções veganas e cruelty-free." },
    { q: "Fazem teste de mecha antes de pintar?", a: "Sim, fazemos teste de mecha e avaliação completa antes de qualquer coloração." },
  ],
  "Barbearia": [
    { q: "Atendem por ordem de chegada?", a: "Trabalhamos com agendamento para garantir seu horário, mas também aceitamos encaixes quando disponível." },
    { q: "Quanto tempo leva o combo completo?", a: "O combo completo (corte + barba + sobrancelha) leva em média 50 minutos." },
    { q: "Fazem corte infantil?", a: "Sim! Atendemos crianças com paciência e cuidado especial." },
    { q: "Têm estacionamento?", a: "Consulte conosco as opções de estacionamento próximo ao estabelecimento." },
  ],
};

const DEFAULT_FAQS = [
  { q: "Como faço para agendar?", a: "Você pode agendar pelo WhatsApp, telefone ou presencialmente. Responderemos o mais rápido possível!" },
  { q: "Qual o horário de funcionamento?", a: "Funcionamos de segunda a sexta das 08h às 18h e aos sábados das 08h às 12h." },
  { q: "Fazem orçamento sem compromisso?", a: "Sim! Entre em contato e faremos um orçamento personalizado sem nenhum compromisso." },
  { q: "Onde ficam localizados?", a: "Estamos localizados em uma região de fácil acesso. Confira nosso endereço completo na seção de contato." },
];

const NICHE_SITE_TEMPLATES: Record<
  string,
  {
    services: { name: string; description: string; icon: string }[];
    about: string;
    tagline: string;
    testimonials: { name: string; text: string; rating: number }[];
    faqs: { q: string; a: string }[];
  }
> = {
  Estetica: {
    services: [
      { name: "Avaliacao personalizada", description: "Entendimento do objetivo e indicacao do melhor protocolo", icon: "✨" },
      { name: "Tratamentos faciais", description: "Limpeza, revitalizacao e cuidados de rotina", icon: "💆" },
      { name: "Procedimentos corporais", description: "Protocolos voltados para bem-estar e autoestima", icon: "🌿" },
      { name: "Agenda por WhatsApp", description: "Contato rapido para tirar duvidas e reservar horario", icon: "📲" },
      { name: "Acompanhamento", description: "Orientacao clara antes, durante e depois do atendimento", icon: "🫶" },
      { name: "Experiencia acolhedora", description: "Ambiente pensado para conforto e confianca", icon: "🕯️" },
    ],
    about:
      "Somos um espaco de estetica focado em atendimento acolhedor, boa apresentacao e confianca logo no primeiro contato.",
    tagline: "Cuidado, imagem e agendamento mais facil.",
    testimonials: [
      { name: "Paula R.", text: "Atendimento super atencioso e ambiente impecavel. Me senti segura do inicio ao fim.", rating: 5 },
      { name: "Marina C.", text: "Agendei pelo WhatsApp e fui muito bem orientada. Experiencia excelente.", rating: 5 },
      { name: "Juliana F.", text: "Gostei porque o atendimento passa confianca e profissionalismo de verdade.", rating: 5 },
    ],
    faqs: [
      { q: "Como funciona a avaliacao inicial?", a: "Fazemos uma conversa rapida para entender seu objetivo e indicar o melhor tratamento." },
      { q: "Vocês atendem com horario marcado?", a: "Sim. Recomendamos agendar para garantir o melhor horario pelo WhatsApp." },
      { q: "Posso tirar duvidas antes de agendar?", a: "Claro. Nossa equipe pode explicar protocolos, duracao e cuidados iniciais." },
      { q: "Quais formas de contato voces usam?", a: "Atendemos por WhatsApp, telefone e canais digitais da marca." },
    ],
  },
  Advogado: {
    services: [
      { name: "Consulta inicial", description: "Primeiro atendimento para entender o caso e orientar o proximo passo", icon: "⚖️" },
      { name: "Atendimento consultivo", description: "Explicacao clara, segura e objetiva sobre o processo", icon: "📘" },
      { name: "Acompanhamento do caso", description: "Atualizacoes e proximidade com o cliente ao longo da demanda", icon: "🤝" },
      { name: "Areas de atuacao", description: "Apresentacao organizada das frentes juridicas atendidas", icon: "📂" },
      { name: "Contato rapido", description: "Canal direto para triagem e primeiro atendimento", icon: "📲" },
      { name: "Credibilidade digital", description: "Presenca mais profissional para gerar confianca logo na pesquisa", icon: "🛡️" },
    ],
    about:
      "Somos um escritorio orientado a atendimento claro, confiavel e proximo, com foco em transformar duvida juridica em encaminhamento seguro.",
    tagline: "Credibilidade para o primeiro contato juridico.",
    testimonials: [
      { name: "Ricardo M.", text: "Fui atendido com clareza e objetividade desde o primeiro contato. Isso fez toda diferenca.", rating: 5 },
      { name: "Bianca T.", text: "Explicaram meu caso de forma simples e me passaram muita seguranca.", rating: 5 },
      { name: "Daniel P.", text: "Atendimento profissional e muito humano. Eu indicaria sem pensar duas vezes.", rating: 5 },
    ],
    faqs: [
      { q: "Como funciona o primeiro atendimento?", a: "Fazemos uma triagem inicial para entender o caso e orientar a melhor forma de seguir." },
      { q: "Vocês atendem online?", a: "Sim. Dependendo da demanda, o primeiro atendimento pode ser online ou presencial." },
      { q: "Posso enviar documentos antes da consulta?", a: "Sim. Em alguns casos isso ajuda a agilizar a analise inicial." },
      { q: "Como entrar em contato rapidamente?", a: "Voce pode falar pelo WhatsApp, telefone ou formulario de contato." },
    ],
  },
  Imobiliaria: {
    services: [
      { name: "Compra e venda", description: "Atendimento consultivo para quem quer comprar ou vender com mais seguranca", icon: "🏠" },
      { name: "Locacao", description: "Processo mais claro para proprietarios e interessados", icon: "🔑" },
      { name: "Captacao de imoveis", description: "Estrutura para receber novos proprietarios e oportunidades", icon: "📍" },
      { name: "Atendimento local", description: "Conhecimento da regiao e apoio proximo durante a jornada", icon: "🧭" },
      { name: "Contato rapido", description: "Canal objetivo para tirar duvidas e iniciar a conversa", icon: "📲" },
      { name: "Apresentacao profissional", description: "Mais confianca para transformar pesquisa em atendimento", icon: "📣" },
    ],
    about:
      "Somos uma imobiliaria focada em atendimento consultivo, boa apresentacao dos imoveis e relacionamento proximo com clientes da regiao.",
    tagline: "Mais confianca para gerar contato e visita.",
    testimonials: [
      { name: "Fernanda A.", text: "O atendimento foi rapido e muito claro. Isso ajudou bastante na decisao.", rating: 5 },
      { name: "Marcos L.", text: "Gostei da forma como organizaram as informacoes e conduziram a visita.", rating: 5 },
      { name: "Patricia R.", text: "Atendimento atencioso e muito profissional do primeiro contato ate a proposta.", rating: 5 },
    ],
    faqs: [
      { q: "Vocês atendem compra, venda e locacao?", a: "Sim. Atuamos nas principais frentes da jornada imobiliaria." },
      { q: "Posso anunciar meu imovel com voces?", a: "Sim. Entre em contato para avaliarmos a captacao e o melhor formato de divulgacao." },
      { q: "Como agendar uma visita?", a: "Fale pelo WhatsApp ou telefone para combinar o melhor horario." },
      { q: "Atendem apenas a regiao local?", a: "Temos foco regional, o que ajuda bastante na qualidade do atendimento." },
    ],
  },
};

function normalizeCategoryKey(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getCategoryValue<T>(
  record: Record<string, T>,
  category: string,
): T | undefined {
  const normalizedCategory = normalizeCategoryKey(category);

  return Object.entries(record).find(
    ([key]) => normalizeCategoryKey(key) === normalizedCategory,
  )?.[1];
}

function getUrlHostLabel(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./i, "");
  } catch {
    return null;
  }
}

function getPrimaryPathSegment(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.pathname === "/profile.php") {
      const profileId = parsed.searchParams.get("id");
      return profileId ? `profile ${profileId}` : null;
    }

    const segments = parsed.pathname.split("/").filter(Boolean);
    if (segments[0] === "pages" && segments[1]) return segments[1];
    return segments[0] ?? null;
  } catch {
    return null;
  }
}

function getInstagramHandle(url: string | null | undefined): string | null {
  const handle = getPrimaryPathSegment(url);
  return handle ? `@${handle.replace(/^@/, "")}` : null;
}

function getFacebookHandle(url: string | null | undefined): string | null {
  const handle = getPrimaryPathSegment(url);
  return handle ? `/${handle.replace(/^\//, "")}` : null;
}

function getLinktreeLabel(url: string | null | undefined): string | null {
  const handle = getPrimaryPathSegment(url);
  return handle ? `linktr.ee/${handle}` : null;
}

function buildSourceLinks(lead: Lead): SiteSourceLink[] {
  const { business, signals } = lead;
  const links: SiteSourceLink[] = [];
  const websiteLabel = getUrlHostLabel(signals.website_url);
  const instagramHandle = getInstagramHandle(signals.instagram_url);
  const facebookHandle = getFacebookHandle(signals.facebook_url);
  const linktreeLabel = getLinktreeLabel(signals.linktree_url);

  if (signals.website_url && websiteLabel) {
    links.push({ kind: "website", label: "Site oficial", value: websiteLabel, href: signals.website_url });
  }

  if (signals.instagram_url && instagramHandle) {
    links.push({ kind: "instagram", label: "Instagram", value: instagramHandle, href: signals.instagram_url });
  }

  if (signals.facebook_url && facebookHandle) {
    links.push({ kind: "facebook", label: "Facebook", value: facebookHandle, href: signals.facebook_url });
  }

  if (signals.linktree_url && linktreeLabel) {
    links.push({ kind: "linktree", label: "Links", value: linktreeLabel, href: signals.linktree_url });
  }

  if (signals.google_maps_url) {
    links.push({ kind: "maps", label: "Google Maps", value: business.region, href: signals.google_maps_url });
  }

  return links;
}

function buildBrandNarrative(lead: Lead, sourceLinks: SiteSourceLink[]): string {
  const { signals } = lead;
  const sentences: string[] = [];
  const websiteLink = sourceLinks.find((link) => link.kind === "website");
  const instagramLink = sourceLinks.find((link) => link.kind === "instagram");
  const facebookLink = sourceLinks.find((link) => link.kind === "facebook");

  if (websiteLink) {
    sentences.push(`Voce tambem pode conhecer mais da marca pelo site oficial ${websiteLink.value}.`);
  }

  if (instagramLink) {
    sentences.push(`No Instagram ${instagramLink.value}, a equipe compartilha novidades, bastidores e trabalhos recentes.`);
  } else if (facebookLink) {
    sentences.push(`A marca tambem mantem presenca ativa no Facebook ${facebookLink.value}.`);
  }

  if (signals.review_count > 0 && signals.average_rating) {
    sentences.push(`No Google, o negocio reune ${signals.review_count} avaliacoes com nota media ${signals.average_rating.toFixed(1)}.`);
  } else if (signals.review_count > 0) {
    sentences.push(`O negocio ja recebeu ${signals.review_count} avaliacoes de clientes no Google.`);
  }

  return sentences.join(" ");
}

function buildAboutHighlights(lead: Lead, sourceLinks: SiteSourceLink[]): string[] {
  const { business, signals } = lead;
  const highlights: string[] = [];
  const websiteLink = sourceLinks.find((link) => link.kind === "website");
  const instagramLink = sourceLinks.find((link) => link.kind === "instagram");

  if (signals.average_rating && signals.review_count > 0) {
    highlights.push(`${signals.average_rating.toFixed(1)} estrelas no Google`);
  }

  if (signals.review_count > 0) {
    highlights.push(`${signals.review_count} avaliacoes de clientes`);
  }

  if (websiteLink) {
    highlights.push(`Site oficial: ${websiteLink.value}`);
  }

  if (instagramLink) {
    highlights.push(`Instagram ${instagramLink.value}`);
  }

  if (signals.whatsapp_detected) {
    highlights.push("Atendimento por WhatsApp");
  }

  highlights.push(`Atendimento em ${business.region}`);
  highlights.push("Equipe qualificada");
  highlights.push("Atendimento humanizado");

  return [...new Set(highlights)].slice(0, 4);
}

function buildSourceBadges(lead: Lead, sourceLinks: SiteSourceLink[]): string[] {
  const { signals } = lead;
  const badges: string[] = [];
  const websiteLink = sourceLinks.find((link) => link.kind === "website");
  const instagramLink = sourceLinks.find((link) => link.kind === "instagram");

  if (websiteLink) {
    badges.push(websiteLink.value);
  }

  if (instagramLink) {
    badges.push(instagramLink.value);
  }

  if (signals.average_rating && signals.review_count > 0) {
    badges.push(`${signals.average_rating.toFixed(1)} estrelas em ${signals.review_count} avaliacoes`);
  } else if (signals.review_count > 0) {
    badges.push(`${signals.review_count} avaliacoes no Google`);
  }

  if (signals.whatsapp_detected) {
    badges.push("Resposta rapida no WhatsApp");
  }

  return [...new Set(badges)].slice(0, 4);
}

function buildSecondaryCta(sourceLinks: SiteSourceLink[]): { label: string; href: string } | null {
  const preferredKinds: Array<SiteSourceLink["kind"]> = ["website", "instagram", "linktree", "maps", "facebook"];

  for (const kind of preferredKinds) {
    const link = sourceLinks.find((item) => item.kind === kind);
    if (!link) continue;

    const labelByKind: Record<SiteSourceLink["kind"], string> = {
      website: "Visitar site oficial",
      instagram: "Ver Instagram",
      facebook: "Abrir Facebook",
      linktree: "Abrir links da marca",
      maps: "Ver no Maps",
    };

    return { label: labelByKind[kind], href: link.href };
  }

  return null;
}

export function generateSiteContent(lead: Lead): SiteContent {
  const { business, signals } = lead;
  const category = business.category;
  const name = business.normalized_name;
  const region = business.region;
  const sourceLinks = buildSourceLinks(lead);
  const nicheTemplate = getCategoryValue(NICHE_SITE_TEMPLATES, category);

  const services =
    nicheTemplate?.services ??
    getCategoryValue(CATEGORY_SERVICES, category) ??
    DEFAULT_SERVICES;
  const aboutBase =
    nicheTemplate?.about ??
    getCategoryValue(CATEGORY_ABOUT, category) ??
    DEFAULT_ABOUT;
  const aboutTextBase = aboutBase
    .replace(/^Somos/, `A ${name} é`)
    .replace(/^Amamos/, `A ${name} ama`)
    .replace(/^Preparamos/, `A ${name} prepara`)
    .replace(/^Seu espaço/, `A ${name} é o seu espaço`)
    .replace(/^Mais do que/, `A ${name} é mais do que`)
    .replace(/^Seu corpo/, `Na ${name}, seu corpo`)
    .replace(/^Cuidamos de quem/, `A ${name} cuida de quem`)
    .replace(/^Cuidamos do seu/, `A ${name} cuida do seu`)
    .replace(/^Transformamos/, `A ${name} transforma`)
    .replace(/^Soluções/, `A ${name} oferece soluções`)
    .replace(/^Suas roupas/, `Na ${name}, suas roupas`)
    .replace(/^Flores e plantas/, `A ${name}: flores e plantas`)
    .replace(/^Moda e estilo/, `A ${name} traz moda e estilo`)
    .replace(/^Lanches feitos/, `A ${name} faz lanches`)
    .replace(/^Tradição e sabor/, `A ${name} é tradição e sabor`)
    .replace(/^Especialistas/, `A ${name} é especialista`);

  const tagline =
    nicheTemplate?.tagline ??
    getCategoryValue(CATEGORY_TAGLINES, category) ??
    "Excelência e confiança na sua região.";
  const brandNarrative = buildBrandNarrative(lead, sourceLinks);
  const aboutText = [aboutTextBase, brandNarrative].filter(Boolean).join(" ");

  const testimonials =
    nicheTemplate?.testimonials ??
    getCategoryValue(CATEGORY_TESTIMONIALS, category) ??
    DEFAULT_TESTIMONIALS;
  const faqs =
    nicheTemplate?.faqs ??
    getCategoryValue(CATEGORY_FAQS, category) ??
    DEFAULT_FAQS;
  const aboutHighlights = buildAboutHighlights(lead, sourceLinks);
  const sourceBadges = buildSourceBadges(lead, sourceLinks);
  const secondaryCta = buildSecondaryCta(sourceLinks);

  const phone = business.phone ?? "";
  const whatsappNumber = phone.replace(/\D/g, "");
  const whatsappMessage = encodeURIComponent(
    `Olá! Vi o site de vocês e gostaria de saber mais sobre os serviços da ${name}.`
  );

  return {
    heroTitle: name,
    heroSubtitle: `${category} em ${region}`,
    tagline: sourceLinks.length > 0 ? `${tagline} Acompanhe a marca pelos canais oficiais.` : tagline,
    aboutText,
    aboutHighlights,
    sourceBadges,
    sourceLinks,
    secondaryCta,
    services,
    testimonials,
    faqs,
    ctaText: signals.whatsapp_detected
      ? "Fale conosco pelo WhatsApp"
      : phone
        ? "Ligue agora"
        : "Entre em contato",
    whatsappMessage: `https://wa.me/55${whatsappNumber}?text=${whatsappMessage}`,
  };
}

export function getCategoryColor(category: string): { primary: string; light: string; gradient: string } {
  const colors: Record<string, { primary: string; light: string; gradient: string }> = {
    "Oficina mecânica": { primary: "#3b82f6", light: "#dbeafe", gradient: "from-blue-900 to-blue-700" },
    "Autoelétrica": { primary: "#14b8a6", light: "#ccfbf1", gradient: "from-teal-900 to-teal-700" },
    "Pet shop": { primary: "#f97316", light: "#ffedd5", gradient: "from-orange-800 to-orange-600" },
    "Restaurante": { primary: "#f43f5e", light: "#ffe4e6", gradient: "from-rose-900 to-rose-700" },
    "Lanchonete": { primary: "#f59e0b", light: "#fef3c7", gradient: "from-amber-800 to-amber-600" },
    "Padaria": { primary: "#d97706", light: "#fef3c7", gradient: "from-yellow-900 to-yellow-700" },
    "Salão de beleza": { primary: "#d946ef", light: "#fae8ff", gradient: "from-fuchsia-900 to-fuchsia-700" },
    "Barbearia": { primary: "#64748b", light: "#f1f5f9", gradient: "from-slate-900 to-slate-700" },
    "Academia": { primary: "#ef4444", light: "#fee2e2", gradient: "from-red-800 to-red-600" },
    "Clínica odontológica": { primary: "#06b6d4", light: "#cffafe", gradient: "from-cyan-800 to-cyan-600" },
    "Clínica veterinária": { primary: "#22c55e", light: "#dcfce7", gradient: "from-green-800 to-green-600" },
    "Vidraçaria": { primary: "#3b82f6", light: "#dbeafe", gradient: "from-blue-800 to-blue-600" },
    "Serralheria": { primary: "#78716c", light: "#f5f5f4", gradient: "from-stone-800 to-stone-600" },
    "Lavanderia": { primary: "#8b5cf6", light: "#ede9fe", gradient: "from-violet-800 to-violet-600" },
    "Floricultura": { primary: "#ec4899", light: "#fce7f3", gradient: "from-pink-800 to-pink-600" },
    "Loja de roupas": { primary: "#8b5cf6", light: "#ede9fe", gradient: "from-violet-900 to-violet-700" },
  };

  return colors[category] ?? { primary: "#3b82f6", light: "#dbeafe", gradient: "from-blue-900 to-blue-700" };
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function getResolvedColor(
  category: string,
  brandColor: string | null | undefined,
): { primary: string; light: string; gradient: string } {
  if (!brandColor) return getCategoryColor(category);

  const { h, s, l } = hexToHsl(brandColor);
  const primary = brandColor;
  const light = hslToHex(h, Math.min(s, 30), 93);
  const darkBg = hslToHex(h, Math.min(s + 10, 80), Math.max(l - 25, 12));
  const darkFg = hslToHex(h, Math.min(s + 5, 70), Math.max(l - 10, 20));

  return { primary, light, gradient: `from-[${darkBg}] to-[${darkFg}]` };
}

export function getSiteVisualTheme(
  lead: Lead,
  primaryColor: string,
): SiteVisualTheme {
  const { signals } = lead;
  const hasWebsite = Boolean(signals.website_url);
  const hasSocial = Boolean(
    signals.instagram_url || signals.facebook_url || signals.linktree_url
  );
  const hasStrongReviews =
    (signals.review_count ?? 0) >= 20 || (signals.average_rating ?? 0) >= 4.7;
  const { h, s, l } = hexToHsl(primaryColor);
  const shiftedColor = hslToHex(
    (h + 12) % 360,
    Math.min(Math.max(s - 14, 20), 38),
    Math.min(Math.max(l + 18, 58), 76),
  );

  if (hasSocial && !hasWebsite) {
    return {
      variant: "social",
      pageBackground: "#17110f",
      navBackground: "rgba(23, 17, 15, 0.9)",
      glassBackground: "rgba(59, 46, 39, 0.78)",
      glassStrongBackground: "rgba(76, 60, 51, 0.9)",
      glassBorder: "rgba(255, 238, 221, 0.08)",
      auraPrimary: `${primaryColor}18`,
      auraSecondary: `${shiftedColor}16`,
      gridOpacity: "0.012",
      shineOpacity: "0.035",
      cardRadius: "26px",
      panelRadius: "32px",
    };
  }

  if (hasWebsite) {
    return {
      variant: "brand",
      pageBackground: "#14100d",
      navBackground: "rgba(20, 16, 13, 0.9)",
      glassBackground: "rgba(53, 42, 35, 0.76)",
      glassStrongBackground: "rgba(71, 56, 47, 0.9)",
      glassBorder: "rgba(255, 236, 214, 0.08)",
      auraPrimary: `${primaryColor}14`,
      auraSecondary: `${shiftedColor}14`,
      gridOpacity: "0.01",
      shineOpacity: "0.03",
      cardRadius: "24px",
      panelRadius: "30px",
    };
  }

  if (hasStrongReviews) {
    return {
      variant: "trusted",
      pageBackground: "#161311",
      navBackground: "rgba(22, 19, 17, 0.92)",
      glassBackground: "rgba(60, 50, 44, 0.75)",
      glassStrongBackground: "rgba(77, 64, 57, 0.9)",
      glassBorder: "rgba(255, 239, 226, 0.1)",
      auraPrimary: `${primaryColor}16`,
      auraSecondary: `${shiftedColor}12`,
      gridOpacity: "0.01",
      shineOpacity: "0.025",
      cardRadius: "20px",
      panelRadius: "26px",
    };
  }

  return {
    variant: "brand",
    pageBackground: "#14100d",
    navBackground: "rgba(20, 16, 13, 0.9)",
    glassBackground: "rgba(53, 42, 35, 0.74)",
    glassStrongBackground: "rgba(71, 56, 47, 0.88)",
    glassBorder: "rgba(255, 236, 214, 0.08)",
    auraPrimary: `${primaryColor}14`,
    auraSecondary: `${shiftedColor}12`,
    gridOpacity: "0.01",
    shineOpacity: "0.03",
    cardRadius: "24px",
    panelRadius: "30px",
  };
}
