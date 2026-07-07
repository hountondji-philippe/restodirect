import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-6 sm:p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Politique de confidentialité</h1>
        
        <div className="prose prose-sm max-w-none text-gray-700 space-y-4">
          <p>RestoDirect s'engage à protéger vos données personnelles.</p>
          
          <h2 className="text-xl font-semibold text-gray-900 mt-6">1. Données collectées</h2>
          <p>Nous collectons : nom, email, téléphone, adresse de livraison, historique de commandes.</p>
          
          <h2 className="text-xl font-semibold text-gray-900 mt-6">2. Utilisation des données</h2>
          <p>Vos données sont utilisées pour traiter vos commandes et améliorer notre service.</p>
          
          <h2 className="text-xl font-semibold text-gray-900 mt-6">3. Partage des données</h2>
          <p>Nous ne vendons jamais vos données. Elles sont partagées uniquement avec les restaurants et livreurs pour traiter vos commandes.</p>
          
          <h2 className="text-xl font-semibold text-gray-900 mt-6">4. Sécurité</h2>
          <p>Nous utilisons le chiffrement et des mesures de sécurité pour protéger vos données.</p>
          
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