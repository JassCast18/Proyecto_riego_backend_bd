import {
  Bell,
  BrainCircuit,
  ClipboardList,
  Cpu,
  FileBarChart,
  LayoutDashboard,
  LifeBuoy,
  SlidersHorizontal,
  Sprout,
  Users,
} from "lucide-react";

export const navGroups = [
  {
    title: "General",
    items: [
      {
        label: "Resumen",
        icon: LayoutDashboard,
        href: "/dashboard",
      },
      {
        label: "Alertas y notificaciones",
        icon: Bell,
        href: "#",
        badge: 3,
      },
      {
        label: "Configuración de cultivo",
        icon: Sprout,
        href: "#",
      },
    ],
  },
  {
    title: "Operación",
    items: [
      {
        label: "Estado de hardware",
        icon: Cpu,
        href: "#",
      },
      {
        label: "Control manual",
        icon: SlidersHorizontal,
        href: "#",
      },
      {
        label: "Reentrenamiento IA",
        icon: BrainCircuit,
        href: "#",
      },
    ],
  },
  {
    title: "Gestión",
    items: [
      {
        label: "Historial y reportes",
        icon: FileBarChart,
        href: "#",
      },
      {
        label: "Auditoría de acciones",
        icon: ClipboardList,
        href: "#",
      },
      {
        label: "Usuarios",
        icon: Users,
        href: "#",
      },
      {
        label: "Soporte y FAQ",
        icon: LifeBuoy,
        href: "#",
      },
    ],
  },
];