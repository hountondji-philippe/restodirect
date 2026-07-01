'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Save, Loader2, CheckCircle, AlertCircle, Smartphone } from 'lucide-react';

export default function PaymentSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    momoMTN: '',
    momoMTNName: '',
    momoMoov: '',
    momoMoovName: '',
    momoCeltiis: '',
    momoCeltiisName: '',
    momoInstructions: '',
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    if (status === 'authenticated' && session?.user) {
      if ((session.user as any).role !== 'RESTAURATEUR') {
        router.push('/');
        return;
      }
      fetchMomoConfig();
    }
  }, [status, session, router]);

  const fetchMomoConfig = async () => {
    try {
      const res = await fetch('/api/dashboard/settings/momo');
      const data = await res.json();
      if (res.ok) {
        setFormData({
          momoMTN: data.momoMTN || '',
          momoMTNName: data.momoMTNName || '',
          momoMoov: data.momoMoov || '',
          momoMoovName: data.momoMoovName || '',
          momoCeltiis: data.momoCeltiis || '',
          momoCeltiisName: data.momoCeltiisName || '',
          momoInstructions: data.momoInstructions || '',
        });
      }
    } catch (err) {
      setError('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const payload = {
        momoMTN: formData.momoMTN || null,
        momoMTNName: formData.momoMTNName || null,
        momoMoov: formData.momoMoov || null,
        momoMoovName: formData.momoMoovName || null,
        momoCeltiis: formData.momoCeltiis || null,
        momoCeltiisName: formData.momoCeltiisName || null,
        momoInstructions: formData.momoInstructions || null,
      };

      const res = await fetch('/api/dashboard/settings/momo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess('Configuration enregistrée avec succès');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Erreur lors de l\'enregistrement');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard/settings"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-500 mb-4 transition-colors font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux paramètres
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Configuration Mobile Money</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configurez vos numéros MTN, Moov et Celtiis pour recevoir les paiements
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-destructive/10 p-3 flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-md bg-green-100 border border-green-200 p-3 flex items-start gap-2">
          <CheckCircle className="h-5 w-5 text-green-700 shrink-0 mt-0.5" />
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Smartphone className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900 mb-1">Comment ça fonctionne ?</p>
            <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
              <li>Un client choisit "Mobile Money" lors du paiement</li>
              <li>Le système affiche vos numéros MTN, Moov ou Celtiis</li>
              <li>Le client fait le transfert depuis son téléphone</li>
              <li>Le client entre l'ID de transaction</li>
              <li>Vous vérifiez sur votre téléphone et confirmez</li>
            </ol>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-background border border-border rounded-lg p-6">
        {/* MTN */}
        <div className="border-b border-border pb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="relative h-10 w-10">
                <Image
                  src="/logos/mtn.png"
                  alt="MTN"
                  fill
                  className="object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <span>MTN Mobile Money</span>
            </div>
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Numéro MTN (8 chiffres)
              </label>
              <input
                type="text"
                value={formData.momoMTN}
                onChange={(e) => setFormData({ ...formData, momoMTN: e.target.value.replace(/\D/g, '').slice(0, 8) })}
                placeholder="97000000"
                pattern="[0-9]{8}"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Nom du titulaire
              </label>
              <input
                type="text"
                value={formData.momoMTNName}
                onChange={(e) => setFormData({ ...formData, momoMTNName: e.target.value })}
                placeholder="Ex: Jean KOUASSI"
                maxLength={100}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </div>

        {/* Moov */}
        <div className="border-b border-border pb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="relative h-10 w-10">
                <Image
                  src="/logos/moov.png"
                  alt="Moov"
                  fill
                  className="object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <span>Moov Money</span>
            </div>
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Numéro Moov (8 chiffres)
              </label>
              <input
                type="text"
                value={formData.momoMoov}
                onChange={(e) => setFormData({ ...formData, momoMoov: e.target.value.replace(/\D/g, '').slice(0, 8) })}
                placeholder="95000000"
                pattern="[0-9]{8}"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Nom du titulaire
              </label>
              <input
                type="text"
                value={formData.momoMoovName}
                onChange={(e) => setFormData({ ...formData, momoMoovName: e.target.value })}
                placeholder="Ex: Jean KOUASSI"
                maxLength={100}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </div>

        {/* Celtiis */}
        <div className="border-b border-border pb-6">
          <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="relative h-10 w-10">
                <Image
                  src="/logos/celtiis.png"
                  alt="Celtiis"
                  fill
                  className="object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
              <span>Celtiis Money</span>
            </div>
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Numéro Celtiis (8 chiffres)
              </label>
              <input
                type="text"
                value={formData.momoCeltiis}
                onChange={(e) => setFormData({ ...formData, momoCeltiis: e.target.value.replace(/\D/g, '').slice(0, 8) })}
                placeholder="96000000"
                pattern="[0-9]{8}"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Nom du titulaire
              </label>
              <input
                type="text"
                value={formData.momoCeltiisName}
                onChange={(e) => setFormData({ ...formData, momoCeltiisName: e.target.value })}
                placeholder="Ex: Jean KOUASSI"
                maxLength={100}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Instructions personnalisées (optionnel)
          </label>
          <textarea
            value={formData.momoInstructions}
            onChange={(e) => setFormData({ ...formData, momoInstructions: e.target.value })}
            rows={3}
            maxLength={500}
            placeholder="Ex: Veuillez utiliser la référence RD-XXXXXX comme motif de transfert"
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Link
            href="/dashboard/settings"
            className="flex-1 inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent transition-colors"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Enregistrer
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}