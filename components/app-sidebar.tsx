'use client';

import * as React from 'react';

import { Building2, FileText, LayoutDashboard, Settings, Users } from 'lucide-react';

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
const data = {
  user: {
    name: 'Admin User',
    email: 'admin@argan.hr',
    avatar: '/avatars/admin.jpg',
  },
  company: {
    name: 'Argan HR',
    logo: Building2,
    plan: 'Enterprise',
  },
  navMain: [
    {
      title: 'Dashboard',
      url: '/admin',
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: 'Clients',
      url: '/admin/clients',
      icon: Users,
      items: [
        {
          title: 'All Clients',
          url: '/admin/clients',
        },
        // {
        //   title: "Add New Client",
        //   url: "/admin/clients/new",
        // },
      ],
    },
    {
      title: 'Documents',
      url: '#',
      icon: FileText,
      badge: 'Coming Soon',
      disabled: true,
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
    : data.user;
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <data.company.logo className="size-4" />
          </div>
          <div className="flex flex-col gap-0.5 leading-none">
            <span className="font-semibold">{data.company.name}</span>
            <span className="text-xs text-muted-foreground">{data.company.plan}</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {data.navManagement && (
          <>
            <div className="px-2 py-2">
              <div className="text-xs font-semibold text-muted-foreground">Management</div>
            </div>
            <NavMain items={data.navManagement} />
          </>
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
