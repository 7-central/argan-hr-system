'use client';

import * as React from 'react';

import { Building2, FileText, LayoutDashboard, Settings, Users, Briefcase } from 'lucide-react';

import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';

// Navigation data for Argan HR
const navData = {
  company: {
    name: 'Argan HR',
    logo: Building2,
  },
  navMain: [
    {
      title: 'Dashboard',
      url: '/admin',
      icon: LayoutDashboard,
    },
    {
      title: 'Clients',
      url: '/admin/clients',
      icon: Users,
    },
    {
      title: 'Contractors',
      url: '#',
      icon: Briefcase,
      badge: 'Coming Soon',
      disabled: true,
    },
    {
      title: 'Client Documents',
      url: '/admin/documents',
      icon: FileText,
    },
  ],
  navManagement: [
    {
      title: 'Admin Users',
      url: '/admin/users',
      icon: Users,
    },
    {
      title: 'Settings',
      url: '/admin/settings',
      icon: Settings,
      badge: 'Coming Soon',
      disabled: true,
    },
  ],
};

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: {
    name: string;
    email: string;
    role?: string;
  };
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  // Use provided user data or fallback to defaults
  const userData = user
    ? {
        name: user.name,
        email: user.email,
        avatar: '/avatars/admin.jpg',
      }
    : {
        name: 'Admin User',
        email: 'admin@argan.hr',
        avatar: '/avatars/admin.jpg',
      };

  return (
    <Sidebar collapsible="icon" className="border-r-0 overflow-hidden" {...props}>
      <div className="relative h-full w-full bg-primary">
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="animate-aurora pointer-events-none absolute -inset-[10px] opacity-30 blur-[10px] will-change-transform"
            style={{
              backgroundImage:
                "repeating-linear-gradient(100deg, #15803d 10%, #16a34a 15%, #22c55e 20%, #4ade80 25%, #86efac 30%)",
              backgroundSize: "200%",
              backgroundPosition: "50% 50%",
            }}
          />
        </div>
        <div className="relative z-10 h-full flex flex-col">
          <SidebarHeader>
            <div className="flex items-center justify-center gap-2 px-2 group-data-[collapsible=icon]:px-0">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-white/20 text-white group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:rounded-md">
                <navData.company.logo className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
                <span className="font-semibold text-white">{navData.company.name}</span>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent className="flex-1">
            <NavMain items={navData.navMain} label="Platform" />
            {navData.navManagement && (
              <NavMain items={navData.navManagement} label="Management" />
            )}
          </SidebarContent>
          <SidebarFooter>
            <NavUser user={userData} />
          </SidebarFooter>
        </div>
      </div>
      <SidebarRail />
    </Sidebar>
  );
}
