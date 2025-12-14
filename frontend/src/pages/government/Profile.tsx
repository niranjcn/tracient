import React, { useState, useEffect } from 'react';
import { 
  User, 
  Building2, 
  Mail, 
  Phone, 
  Shield,
  Lock,
  Save,
  Camera
} from 'lucide-react';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  CardDescription,
  Button,
  Input,
  Spinner,
  Avatar,
  Tabs,
  Alert
} from '@/components/common';
import { showToast } from '@/components/common/Toast';
import { useAuth } from '@/hooks/useAuth';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    designation: '',
    employeeId: '',
    address: '',
    city: '',
    state: '',
  });

  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    anomalyAlerts: true,
    dailyReports: false,
    weeklyDigest: true,
  });

  useEffect(() => {
    const fetchProfile = async () => {
      await new Promise(resolve => setTimeout(resolve, 800));
      setFormData({
        name: user?.name || 'Government Official',
        email: user?.email || 'official@gov.in',
        phone: '+91 11 2345 6789',
        department: 'Ministry of Labour & Employment',
        designation: 'Senior Analyst',
        employeeId: 'GOV-2024-001',
        address: 'Shram Shakti Bhawan',
        city: 'New Delhi',
        state: 'Delhi',
      });
      setIsLoading(false);
    };
    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    showToast.success('Profile updated successfully');
    setIsSaving(false);
  };

  const tabs = [
    { id: 'profile', label: 'Profile Details' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'security', label: 'Security' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account information and preferences</p>
      </div>

      {/* Profile Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              <Avatar name={formData.name} size="xl" />
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center hover:bg-primary-600">
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-xl font-semibold text-gray-900">{formData.name}</h2>
              <p className="text-gray-500">{formData.designation}</p>
              <p className="text-sm text-gray-400">{formData.department}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your personal and contact details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                leftIcon={<User className="h-4 w-4" />}
              />
              <Input
                label="Employee ID"
                value={formData.employeeId}
                disabled
                leftIcon={<Shield className="h-4 w-4" />}
              />
              <Input
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                leftIcon={<Mail className="h-4 w-4" />}
              />
              <Input
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                leftIcon={<Phone className="h-4 w-4" />}
              />
              <Input
                label="Department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                leftIcon={<Building2 className="h-4 w-4" />}
              />
              <Input
                label="Designation"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              />
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">Office Address</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <Input
                  label="Address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="md:col-span-3"
                />
                <Input
                  label="City"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
                <Input
                  label="State"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} isLoading={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>Configure how you receive alerts and updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {Object.entries({
                emailAlerts: { label: 'Email Alerts', desc: 'Receive important alerts via email' },
                anomalyAlerts: { label: 'Anomaly Alerts', desc: 'Get notified when anomalies are detected' },
                dailyReports: { label: 'Daily Reports', desc: 'Receive daily summary reports' },
                weeklyDigest: { label: 'Weekly Digest', desc: 'Weekly summary of all activities' },
              }).map(([key, { label, desc }]) => (
                <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{label}</p>
                    <p className="text-sm text-gray-500">{desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={notifications[key as keyof typeof notifications]}
                      onChange={(e) =>
                        setNotifications({ ...notifications, [key]: e.target.checked })
                      }
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-500"></div>
                  </label>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} isLoading={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                Save Preferences
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <Card>
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
            <CardDescription>Manage your password and security preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert variant="info">
              <Shield className="h-4 w-4" />
              <span>Your account is protected with two-factor authentication.</span>
            </Alert>

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Change Password</h3>
              <Input
                label="Current Password"
                type="password"
                placeholder="Enter current password"
                leftIcon={<Lock className="h-4 w-4" />}
              />
              <Input
                label="New Password"
                type="password"
                placeholder="Enter new password"
                leftIcon={<Lock className="h-4 w-4" />}
              />
              <Input
                label="Confirm New Password"
                type="password"
                placeholder="Confirm new password"
                leftIcon={<Lock className="h-4 w-4" />}
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} isLoading={isSaving}>
                <Lock className="h-4 w-4 mr-2" />
                Update Password
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Profile;
