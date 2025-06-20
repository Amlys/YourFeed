import React from 'react';
import VideoFeed from '../components/VideoFeed';
import FavoritesList from '../components/FavoritesList';

const HomePage: React.FC = () => {
  return (
    <div className="px-3 py-4 lg:px-6 lg:py-6">
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 lg:gap-6">
        <div className="xl:col-span-1">
          <FavoritesList />
        </div>
        <div className="xl:col-span-4">
          <VideoFeed />
        </div>
      </div>
    </div>
  );
};

export default HomePage;