import {
  LayoutDashboard,
  ListChecks,
  KanbanSquare,
  Calendar,
  StickyNote,
  Wallet,
  Bell,
  Archive,
  ShoppingCart,
  Blocks,
  Settings,
  type LucideIcon,
} from "lucide-react";

// Mapa slug -> profesionalna (Lucide) ikona. Koriste je sidebar, dashboard i /apps.
const ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  tasks: ListChecks,
  kanban: KanbanSquare,
  calendar: Calendar,
  notes: StickyNote,
  finance: Wallet,
  reminders: Bell,
  life: Archive,
  shopping: ShoppingCart,
  apps: Blocks,
  settings: Settings,
};

export function AppIcon({
  slug,
  className,
}: {
  slug: string;
  className?: string;
}) {
  const Icon = ICONS[slug] ?? Blocks;
  return <Icon className={className} strokeWidth={1.75} />;
}
