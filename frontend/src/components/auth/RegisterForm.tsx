import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Lock, 
  User, 
  Phone, 
  Eye, 
  EyeOff, 
  ArrowRight,
  Building2,
  CreditCard,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button, Input, Select, Alert } from '@/components/common';
import { registerWorkerSchema, registerEmployerSchema } from '@/utils/validators';
import { ROUTES } from '@/utils/constants';
import { z } from 'zod';
import { UserRole } from '@/types';

type WorkerFormData = z.infer<typeof registerWorkerSchema>;
type EmployerFormData = z.infer<typeof registerEmployerSchema>;

const RegisterForm: React.FC = () => {
  const { register: registerUser, isLoading } = useAuth();
  const _navigate = useNavigate(); // Used for future OTP flow
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'role' | 'form' | 'otp'>('role');
  const [selectedRole, setSelectedRole] = useState<'worker' | 'employer' | null>(null);

  const workerForm = useForm<WorkerFormData>({
    resolver: zodResolver(registerWorkerSchema),
  });

  const employerForm = useForm<EmployerFormData>({
    resolver: zodResolver(registerEmployerSchema),
  });

  const currentForm = selectedRole === 'worker' ? workerForm : employerForm;

  const onSubmit = async (data: WorkerFormData | EmployerFormData) => {
    setError(null);
    try {
      await registerUser({
        ...data,
        role: selectedRole as UserRole,
      });
      setStep('otp');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  const roleOptions = [
    {
      value: 'worker',
      label: 'Worker',
      description: 'I want to track my wages and check BPL status',
      icon: User,
      color: 'blue',
    },
    {
      value: 'employer',
      label: 'Employer',
      description: 'I want to record wages for my workers',
      icon: Building2,
      color: 'green',
    },
  ];

  const organizationTypes = [
    { value: 'private', label: 'Private Company' },
    { value: 'public', label: 'Public Sector' },
    { value: 'ngo', label: 'NGO' },
    { value: 'individual', label: 'Individual Employer' },
  ];

  if (step === 'role') {
    return (
      <div className="space-y-6">
        <div className="text-center lg:text-left">
          <h2 className="text-2xl font-bold text-gray-900">Create an account</h2>
          <p className="mt-2 text-gray-600">
            Select your account type to get started
          </p>
        </div>

        <div className="space-y-3">
          {roleOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                onClick={() => {
                  setSelectedRole(option.value as 'worker' | 'employer');
                  setStep('form');
                }}
                className={`w-full p-4 border-2 rounded-xl text-left transition-all hover:border-${option.color}-500 hover:bg-${option.color}-50 group`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-${option.color}-100 flex items-center justify-center group-hover:bg-${option.color}-200 transition-colors`}>
                    <Icon className={`h-6 w-6 text-${option.color}-600`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{option.label}</h3>
                    <p className="text-sm text-gray-500 mt-1">{option.description}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 mt-3" />
                </div>
              </button>
            );
          })}
        </div>

        <p className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link
            to={ROUTES.LOGIN}
            className="font-medium text-primary-600 hover:text-primary-500"
          >
            Sign in
          </Link>
        </p>

        <p className="text-center text-xs text-gray-500">
          Government and Admin accounts are created by system administrators.
        </p>
      </div>
    );
  }

  if (step === 'otp') {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <Mail className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Check your email</h2>
          <p className="mt-2 text-gray-600">
            We've sent a verification code to your email address.
            Please check your inbox and enter the code below.
          </p>
        </div>

        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <input
              key={i}
              type="text"
              maxLength={1}
              className="w-12 h-14 text-center text-xl font-bold border-2 border-gray-200 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
            />
          ))}
        </div>

        <Button className="w-full" size="lg">
          Verify Email
        </Button>

        <p className="text-center text-sm text-gray-600">
          Didn't receive the code?{' '}
          <button className="font-medium text-primary-600 hover:text-primary-500">
            Resend
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => setStep('role')}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to role selection
        </button>
        <h2 className="text-2xl font-bold text-gray-900">
          Create {selectedRole === 'worker' ? 'Worker' : 'Employer'} Account
        </h2>
        <p className="mt-2 text-gray-600">
          Fill in your details to get started
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Form */}
      <form onSubmit={currentForm.handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Full Name"
          placeholder="Enter your full name"
          leftIcon={<User className="h-5 w-5" />}
          error={currentForm.formState.errors.name?.message}
          {...currentForm.register('name')}
        />

        <Input
          label="Email Address"
          type="email"
          placeholder="Enter your email"
          leftIcon={<Mail className="h-5 w-5" />}
          error={currentForm.formState.errors.email?.message}
          {...currentForm.register('email')}
        />

        <Input
          label="Phone Number"
          type="tel"
          placeholder="Enter your phone number"
          leftIcon={<Phone className="h-5 w-5" />}
          error={currentForm.formState.errors.phone?.message}
          {...currentForm.register('phone')}
        />

        {selectedRole === 'worker' && (
          <Input
            label="Aadhaar Number"
            placeholder="XXXX XXXX XXXX"
            leftIcon={<CreditCard className="h-5 w-5" />}
            error={(currentForm.formState.errors as any).aadhaarNumber?.message}
            {...currentForm.register('aadhaarNumber')}
          />
        )}

        {selectedRole === 'employer' && (
          <>
            <Input
              label="Organization Name"
              placeholder="Enter organization name"
              leftIcon={<Building2 className="h-5 w-5" />}
              error={(currentForm.formState.errors as any).organizationName?.message}
              {...currentForm.register('organizationName')}
            />
            <Select
              label="Organization Type"
              options={organizationTypes}
              placeholder="Select organization type"
              error={(currentForm.formState.errors as any).organizationType?.message}
              {...currentForm.register('organizationType')}
            />
          </>
        )}

        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Create a password"
          leftIcon={<Lock className="h-5 w-5" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="focus:outline-none"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          }
          error={currentForm.formState.errors.password?.message}
          {...currentForm.register('password')}
        />

        <Input
          label="Confirm Password"
          type={showConfirmPassword ? 'text' : 'password'}
          placeholder="Confirm your password"
          leftIcon={<Lock className="h-5 w-5" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="focus:outline-none"
            >
              {showConfirmPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          }
          error={currentForm.formState.errors.confirmPassword?.message}
          {...currentForm.register('confirmPassword')}
        />

        <div className="flex items-start">
          <input
            type="checkbox"
            id="terms"
            className="mt-1 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
          <label htmlFor="terms" className="ml-2 text-sm text-gray-600">
            I agree to the{' '}
            <Link to="/terms" className="text-primary-600 hover:text-primary-500">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-primary-600 hover:text-primary-500">
              Privacy Policy
            </Link>
          </label>
        </div>

        <Button
          type="submit"
          className="w-full"
          size="lg"
          isLoading={isLoading}
        >
          Create Account
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </form>

      <p className="text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link
          to={ROUTES.LOGIN}
          className="font-medium text-primary-600 hover:text-primary-500"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
};

export default RegisterForm;
