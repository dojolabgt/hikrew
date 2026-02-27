
export interface Service {
    title: string;
    description: string;
    iconName: "Globe" | "LayoutTemplate" | "Code2";
}

export interface Project {
    title: string;
    description: string;
    image: string;
    tags: string[];
    link: string;
    locked: boolean;
}

export const getHeroData = () => ({
    title: "Construyendo Experiencias Digitales",
    subtitle: "Hola, soy un desarrollador enfocado en crear aplicaciones web pulidas y centradas en el usuario.",
    ctaPrimary: "Ver Proyectos",
    ctaSecondary: "Servicios",
});

export const getServices = (): Service[] => [
    {
        title: "Desarrollo Web",
        description: "Construcción de sitios web rápidos, responsivos y accesibles utilizando frameworks modernos como Next.js.",
        iconName: "Globe",
    },
    {
        title: "Arquitectura Frontend",
        description: "Diseño de sistemas frontend escalables y mantenibles con estructuras de componentes claras.",
        iconName: "LayoutTemplate",
    },
    {
        title: "Integración Backend",
        description: "Conexión de frontends a backends robustos, asegurando un flujo de datos fluido y seguridad.",
        iconName: "Code2",
    },
];

export const getProjects = (): Project[] => [
    {
        title: "E-Commerce Platform",
        description: "Una solución completa de comercio electrónico con procesamiento de pagos y gestión de inventario.",
        image: "/placeholder-project.jpg",
        tags: ["Next.js", "Stripe", "PostgreSQL"],
        link: "#",
        locked: true,
    },
    {
        title: "Dashboard SaaS",
        description: "Panel de análisis para rastrear métricas comerciales y participación de usuarios.",
        image: "/placeholder-project.jpg",
        tags: ["React", "Tailwind", "Recharts"],
        link: "#",
        locked: true,
    },
    {
        title: "App de Red Social",
        description: "Aplicación de redes sociales en tiempo real con chat y compartición de medios.",
        image: "/placeholder-project.jpg",
        tags: ["Socket.io", "Node.js", "Redis"],
        link: "#",
        locked: false,
    },
    {
        title: "Sitio Web Personal",
        description: "Portafolio personal minimalista construido con Next.js y Tailwind CSS.",
        image: "/placeholder-project.jpg",
        tags: ["Next.js", "Tailwind", "Framer Motion"],
        link: "#",
        locked: false,
    },
    {
        title: "Gestor de Tareas AI",
        description: "Aplicación de productividad que utiliza IA para priorizar y organizar tareas diarias.",
        image: "/placeholder-project.jpg",
        tags: ["OpenAI API", "React Query", "Supabase"],
        link: "#",
        locked: false,
    },
];
