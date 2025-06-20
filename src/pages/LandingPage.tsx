// filepath: c:\Users\LAM\Downloads\project\src\pages\LandingPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Youtube, PlayCircle, Star, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Header from '../components/Header';
import { extractFirstName } from '../utils/userUtils';

const LandingPage: React.FC = () => {
  const { currentUser, signInWithGoogle } = useAuth();

  // Si l'utilisateur est déjà connecté, on peut afficher un message de bienvenue
  if (currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Header />
        <div className="pt-16 lg:pt-18 flex items-center justify-center min-h-screen">
          <div className="text-center px-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Bienvenue, {extractFirstName(currentUser.displayName, currentUser.email)} !
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              Vous êtes connecté. Accédez à votre feed personnalisé.
            </p>
            <Link
              to="/home"
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors shadow-lg"
            >
              Accéder au Feed
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleSignIn = async () => {
    await signInWithGoogle();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="pt-16 lg:pt-18">
        {/* Hero Section */}
        <section className="py-20 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-8">
              <Youtube size={64} className="text-red-600" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              YourFeed
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Suivez vos chaînes YouTube préférées et découvrez leurs dernières vidéos et RIEN D'AUTRE !
            </p>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">Pas de Shorts, pas de suggestions, pas de pubs. </p>
            <button
              onClick={handleSignIn}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors shadow-xl transform hover:scale-105"
            >
              Commencer avec Google
            </button>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white dark:bg-gray-800">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-white mb-16">
              Pourquoi choisir YourFeed ?
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center p-6">
                <PlayCircle size={48} className="text-red-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Vidéos Récentes
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Accédez rapidement aux dernières vidéos de toutes vos chaînes favorites
                </p>
              </div>
              <div className="text-center p-6">
                <Star size={48} className="text-red-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Organisation Simple
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Marquez les vidéos comme vues, à regarder plus tard ou supprimez-les
                </p>
              </div>
              <div className="text-center p-6">
                <Users size={48} className="text-red-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                  Chaînes Favorites
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Gérez facilement votre liste de chaînes YouTube préférées
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              Prêt à commencer ?
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              Connectez-vous avec votre compte Google et découvrez une nouvelle façon de suivre YouTube
            </p>
            <button
              onClick={handleSignIn}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors shadow-lg"
            >
              Se connecter maintenant
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default LandingPage;
