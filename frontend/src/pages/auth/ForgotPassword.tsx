import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button, Input, Alert } from '@/components/common';
import { ROUTES } from '@/utils/constants';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // API call would go here
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIsSubmitted(true);
    } catch (err) {
      setError('Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <Mail className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Check your email</h2>
        <p className="text-gray-600">
          We've sent a password reset link to <strong>{email}</strong>.
          Please check your inbox and follow the instructions.
        </p>
        <Button
          onClick={() => setIsSubmitted(false)}
          variant="outline"
          className="w-full"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to reset
        </Button>
        <Link
          to={ROUTES.LOGIN}
          className="block text-sm text-primary-600 hover:text-primary-500"
        >
          Return to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center lg:text-left">
        <h2 className="text-2xl font-bold text-gray-900">Forgot password?</h2>
        <p className="mt-2 text-gray-600">
          No worries, we'll send you reset instructions.
        </p>
      </div>

      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Email Address"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<Mail className="h-5 w-5" />}
          required
        />

        <Button
          type="submit"
          className="w-full"
          size="lg"
          isLoading={isLoading}
        >
          Reset Password
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </form>

      <Link
        to={ROUTES.LOGIN}
        className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to sign in
      </Link>
    </div>
  );
};

export default ForgotPassword;
