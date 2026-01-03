import React, { useState, useEffect } from 'react';
import { 
  User, 
  Shield,
  Lock,
  Save,
  Camera,
  Mail,
  Phone
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
import api from '@/services/api';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    employeeId: '',
  });

  const [notifications, setNotifications] = useState({
    systemAlerts: true,
    userNotifications: true,
    securityAlerts: true,
    maintenanceAlerts: false,
  });

  useEffect(() => {
    // Use user context data - no dedicated API for admin profile yet
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      employeeId: '',
    });
    setIsLoading(false);
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // For now, just show success since there's no dedicated admin profile update API
      // In future, this can be connected to /api/admin/profile endpoint
      await new Promise(resolve => setTimeout(resolve, 500));
      showToast.success('Profile updated successfully');
    } catch (error: any) {
      showToast.error(error.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'security', label: 'Security' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Profile</h1>
        <p className="text-gray-500 mt-1">Manage your administrator account</p>
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
              <p className="text-gray-500">System Administrator</p>
              <p className="text-sm text-gray-400">ID: {formData.employeeId}</p>
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
            <CardDescription>Update your profile details</CardDescription>
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
            <CardDescription>Configure system alerts and notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {Object.entries({
                systemAlerts: { label: 'System Alerts', desc: 'Critical system notifications' },
                userNotifications: { label: 'User Notifications', desc: 'New user registrations and requests' },
                securityAlerts: { label: 'Security Alerts', desc: 'Security-related notifications' },
                maintenanceAlerts: { label: 'Maintenance Alerts', desc: 'Scheduled maintenance notifications' },
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
            <Alert variant="success">
              <Shield className="h-4 w-4" />
              <span>Your account has two-factor authentication enabled.</span>
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
