import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Shield, 
  ArrowRight, 
  CheckCircle, 
  Users, 
  Building2, 
  Landmark,
  Lock,
  Zap,
  BarChart3,
  Globe
} from 'lucide-react';
import { Button } from '@/components/common';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/utils/constants';

const Home: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users to their dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      const dashboardRoute = getDashboardRoute();
      navigate(dashboardRoute, { replace: true });
    }
  }, [isAuthenticated, user]);

  const getDashboardRoute = () => {
    if (!user) return ROUTES.LOGIN;
    switch (user.role) {
      case 'worker': return ROUTES.WORKER_DASHBOARD;
      case 'employer': return ROUTES.EMPLOYER_DASHBOARD;
      case 'government': return ROUTES.GOV_DASHBOARD;
      case 'admin': return ROUTES.ADMIN_DASHBOARD;
      default: return ROUTES.LOGIN;
    }
  };

  const features = [
    {
      icon: Lock,
      title: 'Immutable Records',
      description: 'All wage records are stored on blockchain, ensuring data cannot be tampered with or altered.',
    },
    {
      icon: Zap,
      title: 'Real-time Verification',
      description: 'Instantly verify income status for welfare eligibility with our blockchain-powered system.',
    },
    {
      icon: BarChart3,
      title: 'AI Fraud Detection',
      description: 'Advanced ML algorithms detect anomalies and prevent fraudulent welfare claims.',
    },
    {
      icon: Globe,
      title: 'Transparent System',
      description: 'Complete transparency in income tracking with privacy-preserving technology.',
    },
  ];

  const userTypes = [
    {
      icon: Users,
      title: 'Workers',
      description: 'Track your wages, check BPL status, and access welfare benefits easily.',
      color: 'blue',
    },
    {
      icon: Building2,
      title: 'Employers',
      description: 'Record wages digitally and ensure compliance with labor regulations.',
      color: 'green',
    },
    {
      icon: Landmark,
      title: 'Government',
      description: 'Monitor income distribution and manage welfare programs effectively.',
      color: 'purple',
    },
  ];

  const stats = [
    { value: '10M+', label: 'Wage Records' },
    { value: '500K+', label: 'Workers Registered' },
    { value: '50K+', label: 'Employers' },
    { value: '99.9%', label: 'Uptime' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Tracient</span>
            </Link>
            <div className="flex items-center gap-4">
              {isAuthenticated ? (
                <Button onClick={() => navigate(getDashboardRoute())}>
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <>
                  <Link
                    to={ROUTES.LOGIN}
                    className="text-gray-600 hover:text-gray-900 font-medium"
                  >
                    Sign in
                  </Link>
                  <Button onClick={() => navigate(ROUTES.REGISTER)}>
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 rounded-full text-primary-700 text-sm font-medium mb-6">
              <Shield className="h-4 w-4" />
              Powered by Hyperledger Fabric
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Blockchain-Based
              <span className="text-primary-600"> Income Traceability</span>
              <br />System
            </h1>
            <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto">
              Ensuring equitable welfare distribution through transparent and 
              immutable income verification. Join thousands of workers, employers, 
              and government agencies in building a fairer system.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" onClick={() => navigate(ROUTES.REGISTER)}>
                Create Account
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate(ROUTES.LOGIN)}>
                Sign In
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-primary-600">{stat.value}</div>
                <div className="mt-2 text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Why Choose Tracient?</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Our platform combines blockchain technology with AI to create a 
              transparent and fraud-resistant income verification system.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-primary-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                  <p className="mt-2 text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* User Types Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">For Everyone</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Whether you're a worker, employer, or government official, 
              Tracient provides the tools you need.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {userTypes.map((type, index) => {
              const Icon = type.icon;
              return (
                <div
                  key={index}
                  className={`bg-${type.color}-50 p-8 rounded-2xl border-2 border-${type.color}-100 hover:border-${type.color}-300 transition-colors`}
                >
                  <div className={`w-14 h-14 rounded-xl bg-${type.color}-100 flex items-center justify-center mb-6`}>
                    <Icon className={`h-7 w-7 text-${type.color}-600`} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">{type.title}</h3>
                  <p className="mt-3 text-gray-600">{type.description}</p>
                  <div className="mt-6 space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className={`h-4 w-4 text-${type.color}-500`} />
                        <span>Feature benefit {i}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white">
            Ready to get started?
          </h2>
          <p className="mt-4 text-lg text-white/80">
            Join Tracient today and be part of a more transparent and equitable system.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate(ROUTES.REGISTER)}
              className="bg-white text-primary-600 hover:bg-gray-100"
            >
              Create Free Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Link
              to="/about"
              className="text-white hover:text-white/80 font-medium"
            >
              Learn more →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6" />
              <span className="font-bold">Tracient</span>
            </div>
            <div className="flex items-center gap-8">
              <Link to="/privacy" className="text-gray-400 hover:text-white">Privacy</Link>
              <Link to="/terms" className="text-gray-400 hover:text-white">Terms</Link>
              <Link to="/contact" className="text-gray-400 hover:text-white">Contact</Link>
            </div>
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Tracient. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
