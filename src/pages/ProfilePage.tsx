import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Phone, MapPin, Shield, Bell, Eye, Moon, HelpCircle, LogOut, ChevronRight, Settings, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, seniorMode, toggleSeniorMode, highContrast, toggleHighContrast, addresses } = useApp();
  
  const [notifications, setNotifications] = useState(true);

  const menuSections = [
    {
      title: 'Accessibility',
      items: [
        {
          icon: Eye,
          label: 'Senior Mode',
          description: 'Larger text, buttons & voice guidance',
          action: <Switch checked={seniorMode} onCheckedChange={toggleSeniorMode} />,
        },
        {
          icon: Moon,
          label: 'High Contrast',
          description: 'Enhanced visibility',
          action: <Switch checked={highContrast} onCheckedChange={toggleHighContrast} />,
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          icon: User,
          label: 'Personal Information',
          description: 'Name, age, medical history',
          onClick: () => {},
        },
        {
          icon: MapPin,
          label: 'Saved Addresses',
          description: `${addresses.length} address${addresses.length !== 1 ? 'es' : ''} saved`,
          onClick: () => {},
        },
        {
          icon: Bell,
          label: 'Notifications',
          description: 'Order updates & reminders',
          action: <Switch checked={notifications} onCheckedChange={setNotifications} />,
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: HelpCircle,
          label: 'Help & FAQ',
          description: 'Get answers to common questions',
          onClick: () => {},
        },
        {
          icon: Phone,
          label: 'Contact Support',
          description: 'Available 24/7',
          onClick: () => {},
        },
        {
          icon: Shield,
          label: 'Privacy Policy',
          description: 'How we protect your data',
          onClick: () => {},
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen pb-24 md:pb-8">
      {/* Header */}
      <div className="gradient-primary py-8 px-4">
        <div className="container">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <User size={40} className="text-primary-foreground" />
            </div>
            <div>
              <h1 className={cn(
                "font-bold text-primary-foreground",
                seniorMode ? "text-2xl" : "text-xl"
              )}>
                {user?.name || 'Guest User'}
              </h1>
              <p className="text-primary-foreground/80">
                {user?.phone || 'Sign in to manage your account'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container px-4 py-6 space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Package, label: 'Orders', path: '/orders' },
            { icon: MapPin, label: 'Addresses', path: '#' },
            { icon: Settings, label: 'Settings', path: '#' },
          ].map(({ icon: Icon, label, path }) => (
            <button
              key={label}
              onClick={() => path !== '#' && navigate(path)}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors",
                seniorMode && "p-5"
              )}
            >
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <Icon size={20} className="text-primary" />
              </div>
              <span className={cn("text-sm font-medium", seniorMode && "text-base")}>{label}</span>
            </button>
          ))}
        </div>

        {/* Menu Sections */}
        {menuSections.map((section) => (
          <div key={section.title} className="bg-card rounded-2xl border border-border overflow-hidden">
            <h2 className={cn(
              "font-semibold text-muted-foreground px-6 py-3 border-b border-border text-sm uppercase tracking-wide",
              seniorMode && "text-base"
            )}>
              {section.title}
            </h2>
            <div className="divide-y divide-border">
              {section.items.map((item) => (
                <div
                  key={item.label}
                  onClick={item.onClick}
                  className={cn(
                    "flex items-center gap-4 px-6 py-4 transition-colors",
                    item.onClick && "cursor-pointer hover:bg-secondary/50"
                  )}
                >
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <item.icon size={20} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("font-medium text-foreground", seniorMode && "text-lg")}>
                      {item.label}
                    </p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                  {item.action || (item.onClick && <ChevronRight size={20} className="text-muted-foreground" />)}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Sign Out */}
        <Button
          variant="outline"
          className="w-full gap-2 text-destructive hover:text-destructive border-destructive/30 hover:bg-destructive/10"
          size="lg"
        >
          <LogOut size={18} />
          Sign Out
        </Button>

        {/* App Version */}
        <p className="text-center text-sm text-muted-foreground">
          MediEase v1.0.0
        </p>
      </div>
    </div>
  );
};

const Package = ({ size, className }: { size: number; className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M16.5 9.4 7.55 4.24" />
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.29 7 12 12 20.71 7" />
    <line x1="12" x2="12" y1="22" y2="12" />
  </svg>
);

export default ProfilePage;
