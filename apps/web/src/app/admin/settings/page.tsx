'use client';

import { useState, useEffect } from 'react';
import { Settings, Mail, Shield, Database, Globe, Info, Loader2, CheckCircle, AlertCircle, Save, Lock, Eye, EyeOff } from 'lucide-react';

interface PlatformSettings {
  platformName: string;
  platformVersion: string;
  environment: string;
  emailProvider: string;
  emailMode: string;
  emailFrom: string;
  databaseType: string;
  databaseFile: string;
  ormVersion: string;
  authProvider: string;
  hashAlgorithm: string;
  rateLimitingEnabled: boolean;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (res.ok) {
        setSettings(data);
      }
    } catch (err) {
      setError('Erreur de chargement des paramètres');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess('Paramètres sauvegardés avec succès');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Erreur lors de la sauvegarde');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('Les mots de passe ne correspondent pas');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    setChangingPassword(true);

    try {
      const res = await fetch('/api/profile/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        setPasswordSuccess('Mot de passe modifié avec succès');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccess(''), 3000);
      } else {
        setPasswordError(data.error || 'Erreur lors du changement');
      }
    } catch (err) {
      setPasswordError('Erreur de connexion');
    } finally {
      setChangingPassword(false);
    }
  };

  const updateSetting = (key: keyof PlatformSettings, value: any) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="h-12 w-12 animate-spin text-orange-500 mb-4" />
        <p className="text-gray-600 text-sm">Chargement des paramètres...</p>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-gray-600">Erreur de chargement des paramètres</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Paramètres</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Configuration de la plateforme RestoDirect
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50 transition-colors"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sauvegarde...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Sauvegarder
            </>
          )}
        </button>
      </div>

      {success && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-background p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-full text-blue-600 bg-blue-100">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Général</h2>
              <p className="text-xs text-muted-foreground">Paramètres généraux de la plateforme</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Nom de la plateforme</label>
              <input
                type="text"
                value={settings.platformName}
                onChange={(e) => updateSetting('platformName', e.target.value)}
                className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Version</label>
              <input
                type="text"
                value={settings.platformVersion}
                onChange={(e) => updateSetting('platformVersion', e.target.value)}
                className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Environnement</label>
              <select
                value={settings.environment}
                onChange={(e) => updateSetting('environment', e.target.value)}
                className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="development">Développement</option>
                <option value="production">Production</option>
                <option value="staging">Staging</option>
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-background p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-full text-green-600 bg-green-100">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Email</h2>
              <p className="text-xs text-muted-foreground">Configuration des emails</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Provider</label>
              <select
                value={settings.emailProvider}
                onChange={(e) => updateSetting('emailProvider', e.target.value)}
                className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="gmail">Gmail</option>
                <option value="resend">Resend</option>
                <option value="smtp">SMTP</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Mode</label>
              <select
                value={settings.emailMode}
                onChange={(e) => updateSetting('emailMode', e.target.value)}
                className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="sandbox">Sandbox (test)</option>
                <option value="production">Production</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Email expéditeur</label>
              <input
                type="email"
                value={settings.emailFrom}
                onChange={(e) => updateSetting('emailFrom', e.target.value)}
                className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-background p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-full text-purple-600 bg-purple-100">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Base de données</h2>
              <p className="text-xs text-muted-foreground">Informations sur la base de données</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Type</label>
              <input
                type="text"
                value={settings.databaseType}
                onChange={(e) => updateSetting('databaseType', e.target.value)}
                className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Fichier/Service</label>
              <input
                type="text"
                value={settings.databaseFile}
                onChange={(e) => updateSetting('databaseFile', e.target.value)}
                className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">ORM</label>
              <input
                type="text"
                value={settings.ormVersion}
                onChange={(e) => updateSetting('ormVersion', e.target.value)}
                className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-background p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-full text-orange-600 bg-orange-100">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Sécurité</h2>
              <p className="text-xs text-muted-foreground">Paramètres de sécurité</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Authentification</label>
              <input
                type="text"
                value={settings.authProvider}
                onChange={(e) => updateSetting('authProvider', e.target.value)}
                className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1 block">Hashage</label>
              <input
                type="text"
                value={settings.hashAlgorithm}
                onChange={(e) => updateSetting('hashAlgorithm', e.target.value)}
                className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="rateLimiting"
                checked={settings.rateLimitingEnabled}
                onChange={(e) => updateSetting('rateLimitingEnabled', e.target.checked)}
                className="h-4 w-4 rounded border-border text-orange-500 focus:ring-orange-500"
              />
              <label htmlFor="rateLimiting" className="text-sm font-medium text-foreground">
                Rate limiting activé
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-border bg-background p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-full text-red-600 bg-red-100">
            <Lock className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Changer le mot de passe</h2>
            <p className="text-xs text-muted-foreground">Modifiez votre mot de passe de connexion</p>
          </div>
        </div>

        {passwordSuccess && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
            <p className="text-sm text-green-800">{passwordSuccess}</p>
          </div>
        )}

        {passwordError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{passwordError}</p>
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Mot de passe actuel</label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Nouveau mot de passe</label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Au moins 6 caractères</p>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Confirmer le nouveau mot de passe</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <button
            type="submit"
            disabled={changingPassword}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-orange-500 px-6 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50 transition-colors"
          >
            {changingPassword ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Modification...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                Changer le mot de passe
              </>
            )}
          </button>
        </form>
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