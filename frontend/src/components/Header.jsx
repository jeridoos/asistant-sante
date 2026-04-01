import React from 'react';
import ProfileMenu from './ProfileMenu';

const Header = ({ user, title }) => {
  return (
    <div className="flex justify-between items-center mb-8">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{title}</h1>
      <div className="flex items-center gap-4">
        {user && <ProfileMenu userId={user.id} />}
      </div>
    </div>
  );
};

export default Header;