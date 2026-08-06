import {
  Bell,
  BrainCircuit,
  ClipboardList,
  Database,
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
        permissionKey: "dashboard.view",
      },
      {
        label: "Alertas y notificaciones",
        icon: Bell,
        href: "/dashboard/notificaciones",
        permissionKey: "alertas.view",
      },
      {
        label: "Configuración de cultivo",
        icon: Sprout,
        href: "#",
        permissionKey: "cultivo.view",
      },
    ],
  },
  {
    title: "Operación",
    items: [
      {
        label: "Estado de hardware",
        icon: Cpu,
        href: "/dashboard/hardware",
        permissionKey: "hardware.view",
      },
      {
        label: "Control manual",
        icon: SlidersHorizontal,
        href: "#",
        permissionKey: "control_manual.view",
      },
      {
        label: "Reentrenamiento IA",
        icon: BrainCircuit,
        href: "#",
        permissionKey: "ia.view",
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
        permissionKey: "reportes.view",
      },
      {
        label: "Auditoría de acciones",
        icon: ClipboardList,
        href: "#",
        permissionKey: "auditoria.view",
      },
      {
        label: "Gestión de usuarios",
        icon: Users,
        href: "/dashboard/usuarios",
        permissionKey: "usuarios.view",
        children: [
          {
            label: "Listado de usuarios",
            href: "/dashboard/usuarios/listado",
            permissionKey: "usuarios.view",
          },
          {
            label: "Registrar usuario",
            href: "/dashboard/usuarios/registrar",
            permissionKey: "usuarios.view",
          },
        ],
      },
      {
        label: "Datos maestros",
        icon: Database,
        href: "/dashboard/maestros/finca",
        permissionKey: "datos_maestros.view",
        children: [
          {
            label: "Finca",
            href: "/dashboard/maestros/finca",
            permissionKey: "finca.view",
          },
          {
            label: "Sector",
            href: "/dashboard/maestros/sector",
            permissionKey: "sector.view",
          },
          {
            label: "Cliente",
            href: "/dashboard/maestros/cliente",
            permissionKey: "cliente.view",
          },
          {
            label: "Roles",
            href: "/dashboard/maestros/roles",
            permissionKey: "roles.view",
          },
          {
            label: "Nodos",
            href: "/dashboard/maestros/nodos",
            permissionKey: "nodos.view",
          },
          {
            label: "Sensores",
            href: "/dashboard/maestros/sensores",
            permissionKey: "sensores.view",
          },
        ],
      },
      {
        label: "Soporte y FAQ",
        icon: LifeBuoy,
        href: "#",
        permissionKey: "soporte.view",
      },
    ],
  },
];
