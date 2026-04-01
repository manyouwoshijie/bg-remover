"use client";

import { useEffect, useState } from 'react';

declare global {
  interface Window {
    google: any;
  }
}

export default function AuthButton() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      window.google.accounts.id.initialize({
        client_id: '474707465172-vsieo3ralvakgboectftk55de0v3n1qp.apps.googleusercontent.com',
        callback: handleCredentialResponse,
      });
    };

    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const handleCredentialResponse = (response: any) => {
    const payload = JSON.parse(atob(response.credential.split('.')[1]));
    setUser(payload);
    localStorage.setItem('user', JSON.stringify(payload));
  };

  const handleLogin = () => {
    window.google.accounts.id.prompt();
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <img src={user.picture} alt="avatar" className="w-8 h-8 rounded-full" />
        <span className="text-sm">{user.name}</span>
        <button onClick={handleLogout} className="text-sm text-red-500 hover:underline">
          退出
        </button>
      </div>
    );
  }

  return (
    <button 
      onClick={handleLogin}
      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
    >
      Google 登录
    </button>
  );
}
