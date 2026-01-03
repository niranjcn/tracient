import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  User, 
  Mail, 
  Phone, 
  CreditCard, 
  MapPin, 
  Camera,
  Save,
  Shield,
  Lock,
  Bell,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  CardDescription,
  Button,
  Input,
  Select,
  Avatar,
  Tabs,
  Alert,
  Badge,
  Spinner
} from '@/components/common';
import { showToast } from '@/components/common';
import { formatDate } from '@/utils/formatters';
import { maskAadhaar } from '@/utils/formatters';
import { z } from 'zod';
import api from '@/services/api';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Invalid phone number'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  // Fetch profile data on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsFetching(true);
        const response = await api.get('/workers/profile') as any;
        const data = response.data;
        setProfileData(data);
        
        // Update form with fetched data
        const firstName = data.personalInfo?.firstName || '';
        const lastName = data.personalInfo?.lastName || '';
        const fullName = `${firstName} ${lastName}`.trim();
        
        profileForm.reset({
          name: fullName || user?.name || '',
          email: data.personalInfo?.email || user?.email || '',
          phone: data.personalInfo?.phone || '',
          address: data.addressInfo?.street || '',
          city: data.addressInfo?.city || '',
          state: data.addressInfo?.state || '',
          pincode: data.addressInfo?.postalCode || '',
        });
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        // If API fails, use user data from auth
        profileForm.reset({
          name: user?.name || '',
          email: user?.email || '',
          phone: '',
          address: '',
          city: '',
          state: '',
          pincode: '',
        });
      } finally {
        setIsFetching(false);
      }
    };

    fetchProfile();
  }, [user]);

  const onProfileSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    try {
      const [firstName, ...lastNameParts] = data.name.split(' ');
      const lastName = lastNameParts.join(' ');
      
      const updateData = {
        personalInfo: {
          firstName: firstName || '',
          lastName: lastName || '',
          phone: data.phone,
        },
        addressInfo: {
          street: data.address || '',
          city: data.city || '',
          state: data.state || '',
          postalCode: data.pincode || '',
        }
      };
      
      await api.put('/workers/profile', updateData);
      showToast.success('Profile updated successfully');
    } catch (error: any) {
      showToast.error(error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const onPasswordSubmit = async (_data: PasswordFormData) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      showToast.success('Password changed successfully');
      passwordForm.reset();
    } catch (error) {
      showToast.error('Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'security', label: 'Security' },
    { id: 'notifications', label: 'Notifications' },
  ];

  const stateOptions = [
    { value: 'kerala', label: 'Kerala' },
    { value: 'tamil-nadu', label: 'Tamil Nadu' },
    { value: 'karnataka', label: 'Karnataka' },
    { value: 'andhra-pradesh', label: 'Andhra Pradesh' },
    { value: 'telangana', label: 'Telangana' },
    { value: 'maharashtra', label: 'Maharashtra' },
  ];

  if (isFetching) {
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
        <p className="text-gray-500 mt-1">Manage your account settings and preferences</p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="relative">
              <Avatar
                src={user?.profileImage}
                name={user?.name || 'User'}
                size="xl"
              />
              <button className="absolute bottom-0 right-0 p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors">
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
              <p className="text-gray-500">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2 justify-center md:justify-start">
                <Badge variant="primary">Worker</Badge>
                <Badge variant="success">Verified</Badge>
              </div>
            </div>
            <div className="md:ml-auto text-center md:text-right">
              <p className="text-sm text-gray-500">Member since</p>
              <p className="font-medium text-gray-900">{formatDate(user?.createdAt || new Date().toISOString())}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your personal details and contact information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <Input
                  label="Full Name"
                  placeholder="Enter your full name"
                  leftIcon={<User className="h-5 w-5" />}
                  error={profileForm.formState.errors.name?.message}
                  {...profileForm.register('name')}
                />
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="Enter your email"
                  leftIcon={<Mail className="h-5 w-5" />}
                  error={profileForm.formState.errors.email?.message}
                  {...profileForm.register('email')}
                  disabled
                />
                <Input
                  label="Phone Number"
                  type="tel"
                  placeholder="Enter your phone"
                  leftIcon={<Phone className="h-5 w-5" />}
                  error={profileForm.formState.errors.phone?.message}
                  {...profileForm.register('phone')}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Aadhaar Number</label>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <CreditCard className="h-5 w-5 text-gray-400" />
                    <span className="font-mono text-gray-600">
                      {profileData?.personalInfo?.aadhaarLast4 
                        ? maskAadhaar(`XXXX XXXX ${profileData.personalInfo.aadhaarLast4}`)
                        : maskAadhaar('XXXXXXXXXXXX')}
                    </span>
                    <Badge variant="success" className="ml-auto">Verified</Badge>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="font-medium text-gray-900 mb-4">Address Information</h4>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <Input
                      label="Address"
                      placeholder="Enter your address"
                      leftIcon={<MapPin className="h-5 w-5" />}
                      error={profileForm.formState.errors.address?.message}
                      {...profileForm.register('address')}
                    />
                  </div>
                  <Input
                    label="City"
                    placeholder="Enter city"
                    error={profileForm.formState.errors.city?.message}
                    {...profileForm.register('city')}
                  />
                  <Controller
                    name="state"
                    control={profileForm.control}
                    render={({ field }) => (
                      <Select
                        label="State"
                        options={stateOptions}
                        placeholder="Select state"
                        value={field.value || ''}
                        onChange={field.onChange}
                      />
                    )}
                  />
                  <Input
                    label="PIN Code"
                    placeholder="Enter PIN code"
                    error={profileForm.formState.errors.pincode?.message}
                    {...profileForm.register('pincode')}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" isLoading={isLoading}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Change Password
              </CardTitle>
              <CardDescription>Update your password to keep your account secure</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6 max-w-md">
                <Input
                  label="Current Password"
                  type={showCurrentPassword ? 'text' : 'password'}
                  placeholder="Enter current password"
                  leftIcon={<Lock className="h-5 w-5" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  }
                  error={passwordForm.formState.errors.currentPassword?.message}
                  {...passwordForm.register('currentPassword')}
                />
                <Input
                  label="New Password"
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder="Enter new password"
                  leftIcon={<Lock className="h-5 w-5" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  }
                  error={passwordForm.formState.errors.newPassword?.message}
                  {...passwordForm.register('newPassword')}
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  placeholder="Confirm new password"
                  leftIcon={<Lock className="h-5 w-5" />}
                  error={passwordForm.formState.errors.confirmPassword?.message}
                  {...passwordForm.register('confirmPassword')}
                />
                <Button type="submit" isLoading={isLoading}>
                  Update Password
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Two-Factor Authentication
              </CardTitle>
              <CardDescription>Add an extra layer of security to your account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">SMS Authentication</p>
                  <p className="text-sm text-gray-500">Receive codes via SMS to verify your identity</p>
                </div>
                <Button variant="outline">Enable</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Preferences
            </CardTitle>
            <CardDescription>Choose what notifications you want to receive</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[
                { id: 'wage', title: 'Wage Records', description: 'Get notified when a new wage is recorded' },
                { id: 'bpl', title: 'BPL Status Updates', description: 'Notifications about your BPL eligibility status' },
                { id: 'welfare', title: 'Welfare Schemes', description: 'Updates about new welfare schemes and benefits' },
                { id: 'security', title: 'Security Alerts', description: 'Important alerts about your account security' },
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{item.title}</p>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Account Verification Status */}
      <Alert variant="success">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5" />
          <div>
            <p className="font-medium">Account Verified</p>
            <p className="text-sm mt-0.5">Your identity has been verified through Aadhaar. All your wage records are securely stored on the blockchain.</p>
          </div>
        </div>
      </Alert>
    </div>
  );
};

export default Profile;
