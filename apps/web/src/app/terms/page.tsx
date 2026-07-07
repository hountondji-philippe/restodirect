import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6 sm:p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Conditions d'utilisation</h1>
        
        <div className="prose prose-sm max-w-none text-gray-700 space-y-4">
          <p>Bienvenue sur RestoDirect. En utilisant notre service, vous acceptez ces conditions.</p>
          
          <h2 className="text-xl font-semibold text-gray-900 mt-6">1. Utilisation du service</h2>
          <p>RestoDirect est une plateforme de livraison de repas qui met en relation les clients, les restaurants et les livreurs.</p>
          
          <h2 className="text-xl font-semibold text-gray-900 mt-6">2. Commandes</h2>
          <p>Les commandes passées via notre plateforme sont soumises à la disponibilité des restaurants et des livreurs.</p>
          
          <h2 className="text-xl font-semibold text-gray-900 mt-6">3. Paiement</h2>
          <p>Nous acceptons plusieurs modes de paiement : espèces à la livraison, Mobile Money (MTN, Moov, Celtiis).</p>
          
          <h2 className="text-xl font-semibold text-gray-900 mt-6">4. Responsabilité</h2>
          <p>RestoDirect n'est pas responsable de la qualité des plats servis par les restaurants partenaires.</p>
          
          <div className="mt-8 pt-6 border-t border-gray-200">
            <Link href="/" className="text-orange-500 hover:text-orange-600 font-medium">
              ← Retour à l'accueil
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}