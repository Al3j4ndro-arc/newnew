import React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

import LoginForm from '../components/forms/LoginForm';

export default function Login() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/me', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    }).then((res) => {
      if (res.ok) {
        navigate('/events');
      }
      setIsLoading(false);
    });
  }, [navigate]);

  return (
    <div>
      {isLoading ? <div></div> : <LoginForm />}
    </div>
  );
}