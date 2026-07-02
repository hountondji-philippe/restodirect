'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Save, Upload, Image as ImageIcon, AlertCircle, Smartphone, CreditCard, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';

export default function RestaurantSettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [uploadMethod, setUploadMethod] = useState<'url' | 'file'>('url');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: '',
    cuisine: '',
    address: '',
    city: '',
    country: '',
    phone: '',
    deliveryTime: '',
    priceRange: '',
    currency: 'XOF',
  });

  useEffect(() => {
    fetchRestaurant();
  }, []);

  const fetchRestaurant = async () => {
    try {
      setError('');
      const res = await fetch('/api/dashboard/restaurant');
      const data = await res.json();

      if (res.ok) {
        setFormData({
          name: data.name || '',
          description: data.description || '',
          image: data.image || '',
          cuisine: data.cuisine || '',
          address: data.address || '',
          city: data.city || '',
          country: data.country || '',
          phone: data.phone || '',
          deliveryTime: data.deliveryTime || '',
          priceRange: data.priceRange || '',
          currency: data.currency || 'XOF',
        });
        setImagePreview(data.image || '');
      } else {
        setError(data.error || 'Erreur lors du chargement des données');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setIsFetching(false);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (e.target.name === 'image') {
      setImagePreview(e.target.value);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Le fichier doit être une image');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    const uploadData = new FormData();
    uploadData.append('image', file);

    try {
      setError('');
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erreur lors de l\'upload');
        return;
      }

      setFormData({ ...formData, image: data.url });
      setImagePreview(data.url);
    } catch (err) {
      setError('Erreur de connexion lors de l\'upload');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    if (!formData.image) {
      setError('Veuillez fournir une image (URL ou fichier)');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/dashboard/restaurant', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details && Array.isArray(data.details)) {
          setError(data.details.map((err: any) => err.message).join(', '));
        } else {
          setError(data.error || 'Erreur lors de la mise à jour');
        }
        return;
      }

      setSuccess('Restaurant mis à jour avec succès !');
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError('Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Chargement des informations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Paramètres du restaurant</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Modifiez les informations de votre restaurant visibles par les clients
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Link
          href="/dashboard/settings/payment"
          className="flex items-center gap-4 p-4 sm:p-6 bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-orange-200 rounded-xl hover:shadow-lg transition-all hover:-translate-y-0.5"
        >
          <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-orange-500 flex items-center justify-center shrink-0">
            <Smartphone className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-base sm:text-lg">Paiement Mobile Money</h3>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Configurez vos numéros MTN, Moov et Celtiis
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-4 p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl">
          <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-blue-500 flex items-center justify-center shrink-0">
            <CreditCard className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-base sm:text-lg">Paiement à la livraison</h3>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Toujours actif - Cash à la livraison
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 sm:p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-semibold text-red-800 mb-1 text-sm sm:text-base">Erreur</h3>
              <p className="text-xs sm:text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 sm:p-4">
          <div className="flex items-start gap-3">
            <div className="h-5 w-5 text-green-600 mt-0.5 shrink-0">✓</div>
            <div>
              <h3 className="font-semibold text-green-800 mb-1 text-sm sm:text-base">Succès</h3>
              <p className="text-xs sm:text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-4 sm:px-6 py-4">
            <h2 className="text-base sm:text-lg font-semibold text-foreground">Informations générales</h2>
          </div>
          
          <div className="p-4 sm:p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-foreground">
                  Nom du restaurant <span className="text-red-500">*</span>
                </label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Ex: Chez Fatou"
                  className="flex h-10 sm:h-11 w-full rounded-md border border-input bg-background px-3 sm:px-4 py-2 text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-foreground">
                  Type de cuisine <span className="text-red-500">*</span>
                </label>
                <input
                  name="cuisine"
                  value={formData.cuisine}
                  onChange={handleChange}
                  required
                  placeholder="Ex: Béninoise, Italienne..."
                  className="flex h-10 sm:h-11 w-full rounded-md border border-input bg-background px-3 sm:px-4 py-2 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium text-foreground">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                placeholder="Décrivez votre restaurant..."
                className="flex w-full rounded-md border border-input bg-background px-3 sm:px-4 py-2 sm:py-3 text-sm resize-none"
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-4 sm:px-6 py-4">
            <h2 className="text-base sm:text-lg font-semibold text-foreground">Image du restaurant</h2>
          </div>
          
          <div className="p-4 sm:p-6 space-y-6">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setUploadMethod('url')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  uploadMethod === 'url' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <ImageIcon className="h-4 w-4" />
                URL d'image
              </button>
              <button
                type="button"
                onClick={() => setUploadMethod('file')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors ${
                  uploadMethod === 'file' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <Upload className="h-4 w-4" />
                Télécharger un fichier
              </button>
            </div>

            {uploadMethod === 'url' ? (
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-foreground">
                  URL de l'image <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={formData.image}
                  onChange={handleChange}
                  name="image"
                  required
                  placeholder="https://exemple.com/image.jpg"
                  className="flex h-10 sm:h-11 w-full rounded-md border border-input bg-background px-3 sm:px-4 py-2 text-sm"
                />
              </div>
            ) : (
              <label className="flex items-center justify-center w-full h-32 sm:h-40 px-4 transition bg-background border-2 border-dashed rounded-md appearance-none cursor-pointer hover:bg-accent/50 border-input">
                <span className="flex flex-col items-center space-y-2">
                  <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
                  <span className="text-xs sm:text-sm text-muted-foreground text-center">
                    Cliquez pour télécharger une image<br/>
                    <span className="text-xs">(JPG, PNG - Max 5Mo)</span>
                  </span>
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            )}

            {(formData.image || imagePreview) && (
              <div className="space-y-2">
                <p className="text-xs sm:text-sm font-medium text-foreground">Aperçu:</p>
                <div className="relative w-full h-48 sm:h-64 rounded-lg overflow-hidden border border-border">
                  <img
                    src={imagePreview || formData.image}
                    alt="Aperçu du restaurant"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-4 sm:px-6 py-4">
            <h2 className="text-base sm:text-lg font-semibold text-foreground">Coordonnées</h2>
          </div>
          
          <div className="p-4 sm:p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium text-foreground">
                Adresse complète <span className="text-red-500">*</span>
              </label>
              <input
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                placeholder="Quartier, rue, numéro..."
                className="flex h-10 sm:h-11 w-full rounded-md border border-input bg-background px-3 sm:px-4 py-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-foreground">
                  Ville <span className="text-red-500">*</span>
                </label>
                <input
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  placeholder="Ex: Cotonou"
                  className="flex h-10 sm:h-11 w-full rounded-md border border-input bg-background px-3 sm:px-4 py-2 text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-foreground">
                  Pays <span className="text-red-500">*</span>
                </label>
                <input
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  required
                  placeholder="Ex: Bénin"
                  className="flex h-10 sm:h-11 w-full rounded-md border border-input bg-background px-3 sm:px-4 py-2 text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs sm:text-sm font-medium text-foreground">
                Téléphone <span className="text-red-500">*</span>
              </label>
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                maxLength={10}
                pattern="^0[1-7][0-9]{8}$"
                placeholder="Ex: 0154561891"
                className="flex h-10 sm:h-11 w-full rounded-md border border-input bg-background px-3 sm:px-4 py-2 text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Format : 10 chiffres commençant par 01 à 07 (ex: 0154561891)
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-4 sm:px-6 py-4">
            <h2 className="text-base sm:text-lg font-semibold text-foreground">Livraison et tarifs</h2>
          </div>
          
          <div className="p-4 sm:p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-foreground">
                  Temps de livraison <span className="text-red-500">*</span>
                </label>
                <input
                  name="deliveryTime"
                  value={formData.deliveryTime}
                  onChange={handleChange}
                  required
                  placeholder="Ex: 30-45 min"
                  className="flex h-10 sm:h-11 w-full rounded-md border border-input bg-background px-3 sm:px-4 py-2 text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-foreground">
                  Gamme de prix <span className="text-red-500">*</span>
                </label>
                <select
                  name="priceRange"
                  value={formData.priceRange}
                  onChange={handleChange}
                  required
                  className="flex h-10 sm:h-11 w-full rounded-md border border-input bg-background px-3 sm:px-4 py-2 text-sm"
                >
                  <option value="">Sélectionner...</option>
                  <option value="€">€ - Économique</option>
                  <option value="€€">€€ - Moyen</option>
                  <option value="€€€">€€€ - Élevé</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs sm:text-sm font-medium text-foreground">
                  Devise <span className="text-red-500">*</span>
                </label>
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  required
                  className="flex h-10 sm:h-11 w-full rounded-md border border-input bg-background px-3 sm:px-4 py-2 text-sm"
                >
                  <option value="XOF">FCFA (Franc CFA)</option>
                  <option value="EUR">EUR (Euro)</option>
                  <option value="USD">USD (Dollar)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4 pt-4">
          <button
            type="button"
            onClick={() => fetchRestaurant()}
            className="inline-flex h-10 sm:h-11 items-center justify-center rounded-md border border-input bg-background px-6 text-sm font-medium"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex h-10 sm:h-11 items-center justify-center gap-2 rounded-md bg-primary px-6 sm:px-8 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Enregistrer les modifications
              </>
            )}
          </button>
        </div>
      </form>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-4 sm:px-6 py-4">
          <div className="flex items-center gap-3">
            <Lock className="h-5 w-5 text-red-500" />
            <h2 className="text-base sm:text-lg font-semibold text-foreground">Changer le mot de passe</h2>
          </div>
        </div>
        
        <div className="p-4 sm:p-6">
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
      </div>
    </div>
  );
}