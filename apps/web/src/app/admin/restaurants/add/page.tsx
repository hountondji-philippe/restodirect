'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, Upload, Image as ImageIcon } from 'lucide-react';

export default function AddRestaurantPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [uploadMethod, setUploadMethod] = useState<'url' | 'file'>('url');

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
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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

    // Vérification manuelle avant envoi
    if (!formData.image) {
      setError('Veuillez fournir une image (URL ou fichier)');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/admin/restaurants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error('Erreur API complète:', data);
        
        if (data.details && Array.isArray(data.details)) {
          const errorMessages = data.details.map((err: any) => {
            return `${err.path.join('.')}: ${err.message}`;
          }).join(', ');
          setError(`Erreur de validation: ${errorMessages}`);
        } else {
          setError(data.error || data.message || 'Erreur lors de la création');
        }
        return;
      }

      setSuccess('Restaurant ajouté avec succès !');
      setFormData({
        name: '', description: '', image: '', cuisine: '',
        address: '', city: '', country: '', phone: '',
        deliveryTime: '', priceRange: '',
      });
      setImagePreview('');
    } catch (err) {
      setError('Erreur de connexion au serveur');
      console.error('Erreur:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin" className="p-2 hover:bg-accent rounded-md">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ajouter un restaurant</h1>
          <p className="text-sm text-muted-foreground">Remplissez les informations pour créer un nouveau restaurant</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-md bg-green-100 border border-green-200 p-4 text-sm text-green-800">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-background p-6 rounded-lg border border-border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Nom du restaurant *</label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Type de cuisine *</label>
            <input
              name="cuisine"
              value={formData.cuisine}
              onChange={handleChange}
              required
              placeholder="Ex: Béninoise, Italienne"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-foreground mb-2">Image du restaurant *</label>
            
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setUploadMethod('url')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  uploadMethod === 'url' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <ImageIcon className="h-4 w-4" />
                URL
              </button>
              <button
                type="button"
                onClick={() => setUploadMethod('file')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  uploadMethod === 'file' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <Upload className="h-4 w-4" />
                Fichier
              </button>
            </div>

            {uploadMethod === 'url' ? (
              <input
                type="url"
                value={formData.image}
                onChange={handleChange}
                name="image"
                required
                placeholder="https://exemple.com/image.jpg"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            ) : (
              <div className="space-y-2">
                <label className="flex items-center justify-center w-full h-32 px-4 transition bg-background border-2 border-input border-dashed rounded-md appearance-none cursor-pointer hover:bg-accent focus:outline-none">
                  <span className="flex flex-col items-center space-y-2">
                    <Upload className="w-6 h-6 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {formData.image ? 'Image sélectionnée' : 'Cliquez pour choisir une image'}
                    </span>
                  </span>
                  <input
                    type="file"
                    name="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            {(formData.image || imagePreview) && (
              <div className="mt-3">
                <p className="text-xs text-muted-foreground mb-2">Aperçu:</p>
                <img
                  src={imagePreview || formData.image}
                  alt="Aperçu"
                  className="w-full h-48 object-cover rounded-md border border-border"
                />
              </div>
            )}
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-foreground">Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={3}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-foreground">Adresse complète *</label>
            <input
              name="address"
              value={formData.address}
              onChange={handleChange}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Ville *</label>
            <input
              name="city"
              value={formData.city}
              onChange={handleChange}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Pays *</label>
            <input
              name="country"
              value={formData.country}
              onChange={handleChange}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Téléphone *</label>
            <input
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Temps de livraison *</label>
            <input
              name="deliveryTime"
              value={formData.deliveryTime}
              onChange={handleChange}
              required
              placeholder="Ex: 25-35 min"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Gamme de prix *</label>
            <input
              name="priceRange"
              value={formData.priceRange}
              onChange={handleChange}
              required
              placeholder="Ex: €, €€, €€€"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Link
            href="/admin"
            className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Enregistrer le restaurant
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}