const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    if (!res.ok) {
        throw new Error(`API Error: ${res.status} ${res.statusText}`);
    }

    return res.json();
}

// --- Dummy Data Functions (Kept from original frontend) ---

export interface Service {
    title: string;
    description: string;
    iconName: "Globe" | "LayoutTemplate" | "Code2" | "Shield" | "Container" | "Layers";
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
    title: "NexStack Starter",
    subtitle: "El boilerplate definitivo para tus aplicaciones Fullstack. Next.js, NestJS y Docker configurados para producción.",
    ctaPrimary: "Ver Demo",
    ctaSecondary: "Documentación",
});

export const getFeatures = (): Service[] => [
    {
        title: "Fullstack Type-Safety",
        description: "Experiencia de desarrollo inigualable con tipado estático de extremo a extremo compartiendo interfaces entre Backend y Frontend.",
        iconName: "Code2",
    },
    {
        title: "Autenticación Lista",
        description: "Sistema de autenticación robusto pre-configurado con JWT, protegiendo rutas y API endpoints desde el primer día.",
        iconName: "Shield",
    },
    {
        title: "Docker Compose",
        description: "Entorno de desarrollo y producción containerizado. Levanta base de datos, backend y frontend con un solo comando.",
        iconName: "Container",
    },
    {
        title: "Arquitectura Modular",
        description: "Estructura de carpetas escalable en NestJS y componentes reutilizables en Next.js para crecer sin dolor.",
        iconName: "Layers",
    },
    {
        title: "UI Component Library",
        description: "Kit de UI moderno y accesible basado en Radix y Tailwind, con modo oscuro automático y animaciones fluidas.",
        iconName: "LayoutTemplate",
    },
    {
        title: "Base de Datos ORM",
        description: "Prisma o TypeORM configurado para manejo de base de datos eficiente y migraciones seguras.",
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
