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
  MessageCircle,
  Blocks,
  Settings,
  Users,
  Zap,
  UserCircle,
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
  chat: MessageCircle,
  apps: Blocks,
  settings: Settings,
  members: Users,
  automations: Zap,
  profile: UserCircle,
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
