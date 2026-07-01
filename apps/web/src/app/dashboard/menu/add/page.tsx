'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Loader2, Save, AlertCircle, Upload, X } from 'lucide-react';

export default function AddMenuItemPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMethod, setUploadMethod] = useState<'url' | 'file'>('url');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image: '',
    category: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'image') {
      setImagePreview(value);
      setImageFile(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('L\'image ne doit pas dépasser 5Mo');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('Veuillez sélectionner une image valide');
        return;
      }
      
      setError('');
      setImageFile(file);
      setUploadMethod('file');
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async (file: File): Promise<string | null> => {
    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('image', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      const data = await res.json();

      if (res.ok) {
        return data.url;
      } else {
        setError(data.error || 'Erreur lors de l\'upload');
        return null;
      }
    } catch (err) {
      setError('Erreur de connexion');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const price = parseFloat(formData.price);
      if (isNaN(price) || price <= 0) {
        setError('Le prix doit être un nombre positif');
        setLoading(false);
        return;
      }

      let imageUrl = formData.image;

      if (imageFile) {
        const uploadedUrl = await handleImageUpload(imageFile);
        if (!uploadedUrl) {
          setLoading(false);
          return;
        }
        imageUrl = uploadedUrl;
      }

      if (!imageUrl) {
        setError('Veuillez fournir une image (URL ou fichier)');
        setLoading(false);
        return;
      }

      const res = await fetch('/api/dashboard/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          price,
          image: imageUrl,
          category: formData.category,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || data.details?.[0]?.message || 'Erreur lors de la création');
        return;
      }

      router.push('/dashboard/menu');
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard/menu"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-orange-500 mb-4 transition-colors font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au menu
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Ajouter un plat</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Remplissez les informations pour ajouter un nouveau plat à votre menu
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-destructive/10 p-3 flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 bg-background border border-border rounded-lg p-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
            Nom du plat *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            minLength={2}
            maxLength={100}
            placeholder="Ex: Wagassi Grillé"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
            Description *
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            minLength={5}
            maxLength={500}
            rows={3}
            placeholder="Décrivez votre plat en détail..."
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-foreground mb-2">
              Prix (FCFA) *
            </label>
            <input
              type="number"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              placeholder="2500"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-foreground mb-2">
              Catégorie *
            </label>
            <input
              type="text"
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              minLength={2}
              maxLength={50}
              placeholder="Ex: Plats Principaux"
              list="categories"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <datalist id="categories">
              <option value="Entrées" />
              <option value="Plats Principaux" />
              <option value="Desserts" />
              <option value="Boissons" />
              <option value="Accompagnements" />
            </datalist>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Image du plat *
          </label>
          
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setUploadMethod('url')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                uploadMethod === 'url' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              URL d'image
            </button>
            <button
              type="button"
              onClick={() => setUploadMethod('file')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                uploadMethod === 'file' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              <Upload className="h-4 w-4" />
              Depuis la galerie
            </button>
          </div>

          {imagePreview && (
            <div className="mb-4 relative">
              <div className="relative h-48 w-full rounded-lg overflow-hidden bg-muted border border-border">
                <Image
                  src={imagePreview}
                  alt="Aperçu"
                  fill
                  className="object-cover"
                  onError={() => setImagePreview('')}
                />
              </div>
              {imageFile && (
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview('');
                  }}
                  className="absolute top-2 right-2 h-8 w-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-lg"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

          {uploadMethod === 'file' && (
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-border border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {uploading ? (
                  <>
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Upload en cours...</p>
                  </>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="mb-1 text-sm text-muted-foreground">
                      <span className="font-semibold">Cliquez pour choisir</span> une image
                    </p>
                    <p className="text-xs text-muted-foreground">PNG, JPG ou JPEG (max. 5Mo)</p>
                  </>
                )}
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
              />
            </label>
          )}

          {uploadMethod === 'url' && (
            <input
              type="url"
              id="image"
              name="image"
              value={formData.image}
              onChange={handleChange}
              placeholder="https://images.unsplash.com/..."
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <Link
            href="/dashboard/menu"
            className="flex-1 inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent transition-colors"
          >
            Annuler
          </Link>
          <button
            type="submit"
            disabled={loading || uploading}
            className="flex-1 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {loading || uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {uploading ? 'Upload...' : 'Création...'}
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Ajouter le plat
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}