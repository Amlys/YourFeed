import React, { useState } from 'react';
import { Heart, Video } from 'lucide-react';
import VideoFeed from '../components/VideoFeed';
import FavoritesList from '../components/FavoritesList';

const HomePage: React.FC = () => {
  const [mobileTab, setMobileTab] = useState<'favorites' | 'videos'>('videos');

  return (
    <div className="px-3 py-4 lg:px-6 lg:py-6">
      {/* Mobile Tab Navigation */}
      <div className="xl:hidden mb-4">
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          <button
            onClick={() => setMobileTab('videos')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              mobileTab === 'videos'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Video size={16} />
            <span>Vidéos</span>
          </button>
          <button
            onClick={() => setMobileTab('favorites')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              mobileTab === 'favorites'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Heart size={16} />
            <span>Favoris</span>
          </button>
        </div>
      </div>

      {/* Content Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 lg:gap-6">
        {/* Sidebar - Hidden on mobile, controlled by tabs */}
        <div className={`xl:col-span-1 ${mobileTab === 'favorites' ? 'block xl:block' : 'hidden xl:block'}`}>
          <FavoritesList />
        </div>
        
        {/* Main Content - Hidden on mobile when favorites tab is active */}
        <div className={`xl:col-span-4 ${mobileTab === 'videos' ? 'block xl:block' : 'hidden xl:block'}`}>
          <VideoFeed />
        </div>
      </div>
    </div>
  );
};

export default HomePage;