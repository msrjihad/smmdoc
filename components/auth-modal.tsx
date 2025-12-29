'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { login } from '@/lib/actions/login';
import { register } from '@/lib/actions/register';
import { X } from 'lucide-react';
import { useState } from 'react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'signin' | 'signup';
  onSuccess: () => void;
}

export default function AuthModal({ isOpen, onClose, type, onSuccess }: AuthModalProps) {
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (type === 'signin') {
        const result = await login({
          email: formData.email,
          password: formData.password
        });

        if (result?.error) {
          setError('Invalid credentials');
        } else if (result?.success) {
          onSuccess();
        } else if (result?.twoFactor) {
          setError('2FA required. Please check your email.');
        } else {
          setError('Something went wrong. Please try again.');
        }
      } else {

        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setLoading(false);
          return;
        }

        console.log('FormData before register:', formData);
        console.log('confirmPassword value:', formData.confirmPassword);

        const result = await register({
          username: formData.username,
          name: formData.name,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword
        });

        if (result?.error) {
          setError(result.error);
        } else if (result?.success) {
          setSuccess('Registration successful! Please check your email for verification.');

          setTimeout(() => {
            onSuccess();

            window.location.href = '/verify-email';
          }, 2000);
        } else {
          setError('Something went wrong. Please try again.');
        }
      }
    } catch (error) {
      setError('Something went wrong. Please try again.');
    }

    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      username: '',
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
    setError('');
    setSuccess('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3">
          <CardTitle className="text-xl font-bold">
            {type === 'signin' ? 'Sign In' : 'Sign Up'}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="pt-2 pb-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            {type === 'signup' && (
              <>
                <div className="space-y-1">
                  <Label htmlFor="username" className="text-sm">Username</Label>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="Enter your username"
                    value={formData.username}
                    onChange={handleInputChange}
                    required
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="name" className="text-sm">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="h-9"
                  />
                </div>
              </>
            )}

            <div className="space-y-1">
              <Label htmlFor="email" className="text-sm">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="h-9"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="password" className="text-sm">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="h-9"
              />
            </div>

            {type === 'signup' && (
              <div className="space-y-1">
                <Label htmlFor="confirmPassword" className="text-sm">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  className="h-9"
                />
              </div>
            )}

            {error && (
              <div className="text-red-500 text-sm text-center py-1">
                {error}
              </div>
            )}

            {success && (
              <div className="text-green-500 text-sm text-center py-1">
                {success}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full h-9" 
              disabled={loading}
            >
              {loading ? 'Loading...' : (type === 'signin' ? 'Sign In' : 'Sign Up')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}