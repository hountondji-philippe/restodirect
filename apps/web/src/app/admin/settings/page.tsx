'use client';

import { Settings, Mail, Shield, Database, Globe, Info } from 'lucide-react';

export default function AdminSettingsPage() {
  const settingsSections = [
    {
      title: 'Général',
      description: 'Paramètres généraux de la plateforme',
      icon: Settings,
      color: 'text-blue-600 bg-blue-100',
      items: [
        { label: 'Nom de la plateforme', value: 'RestoDirect' },
        { label: 'Version', value: '1.0.0-dev' },
        { label: 'Environnement', value: 'Développement' },
      ],
    },
    {
      title: 'Email',
      description: 'Configuration des emails',
      icon: Mail,
      color: 'text-green-600 bg-green-100',
      items: [
        { label: 'Provider', value: 'Resend' },
        { label: 'Mode', value: 'Sandbox (test)' },
        { label: 'Email expéditeur', value: 'onboarding@resend.dev' },
      ],
    },
    {
      title: 'Base de données',
      description: 'Informations sur la base de données',
      icon: Database,
      color: 'text-purple-600 bg-purple-100',
      items: [
        { label: 'Type', value: 'SQLite' },
        { label: 'Fichier', value: 'dev.db' },
        { label: 'ORM', value: 'Prisma 5.22.0' },
      ],
    },
    {
      title: 'Sécurité',
      description: 'Paramètres de sécurité',
      icon: Shield,
      color: 'text-orange-600 bg-orange-100',
      items: [
        { label: 'Authentification', value: 'NextAuth.js' },
        { label: 'Hashage', value: 'bcrypt (12 rounds)' },
        { label: 'Rate limiting', value: 'Activé' },
      ],
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Paramètres</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Configuration de la plateforme RestoDirect
        </p>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 mb-6">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-900">Mode développement</p>
            <p className="text-xs text-amber-700 mt-1">
              Ces paramètres sont en lecture seule pour l'instant. La modification des paramètres sera disponible dans une prochaine version.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {settingsSections.map((section) => {
          const Icon = section.icon;
          return (
            <div key={section.title} className="rounded-lg border border-border bg-background p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-3 rounded-full ${section.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{section.title}</h2>
                  <p className="text-xs text-muted-foreground">{section.description}</p>
                </div>
              </div>
              <div className="space-y-3">
                {section.items.map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <span className="text-sm text-muted-foreground">{item.label}</span>
                    <span className="text-sm font-medium text-foreground">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-lg border border-border bg-background p-6">
        <h2 className="text-lg font-semibold mb-4">Actions de maintenance</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent">
            <Database className="h-4 w-4" />
            Sauvegarder la base
          </button>
          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent">
            <Shield className="h-4 w-4" />
            Vérifier la sécurité
          </button>
          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent">
            <Globe className="h-4 w-4" />
            Vider le cache
          </button>
        </div>
      </div>
    </div>
  );
}