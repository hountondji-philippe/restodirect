'use client';

import Link from 'next/link';
import { Clock, ArrowLeft } from 'lucide-react';

export default function DriverPendingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex h-24 w-24 items-center justify-center rounded-full bg-yellow-100 shadow-lg mb-6">
          <Clock className="h-12 w-12 text-yellow-600" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Compte en attente de validation
        </h1>
        
        <p className="text-gray-600 text-lg mb-8">
          Votre inscription a ete recue. Un restaurateur va examiner votre demande et vous contacter pour confirmation.
        </p>

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8 border border-gray-100">
          <h3 className="font-bold text-gray-900 mb-4">Prochaines etapes :</h3>
          <div className="space-y-3 text-left">
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 bg-green-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-green-600 text-xs font-bold">1</span>
              </div>
              <p className="text-sm text-gray-700">Un restaurateur examine votre profil</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 bg-green-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-green-600 text-xs font-bold">2</span>
              </div>
              <p className="text-sm text-gray-700">Il vous contacte par telephone pour verification</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 bg-green-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-green-600 text-xs font-bold">3</span>
              </div>
              <p className="text-sm text-gray-700">Votre compte est active et vous pouvez commencer</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 px-6 text-base font-medium text-white shadow-lg transition-all hover:shadow-xl hover:from-orange-600 hover:to-orange-700"
          >
            <ArrowLeft className="h-5 w-5" />
            Retour a l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}