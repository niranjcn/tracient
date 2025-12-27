import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, Save, X, Loader } from 'lucide-react';
import { wageService } from '@/services';
import { Card, CardContent, Button } from '@/components/common';

interface PersonalInfo {
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: string;
  phone: string;
  alternatePhone?: string;
  email: string;
  occupation?: string;
  skills?: string[];
}

interface AddressInfo {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  district?: string;
  country: string;
}

interface BankAccount {
  _id: string;
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  isDefault: boolean;
}

interface WorkerProfile {
  _id: string;
  personalInfo: PersonalInfo;
  addressInfo: AddressInfo;
  bankAccounts: BankAccount[];
  financialInfo?: {
    totalEarnings: number;
    balance: number;
    annualIncome: number;
    incomeCategory: string;
  };
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<WorkerProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [editedData, setEditedData] = useState<Partial<WorkerProfile>>({
    personalInfo: {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
    },
    addressInfo: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
    },
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await wageService.getWorkerProfile();
      if (response) {
        setProfile(response);
        setEditedData(response);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load profile');
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData(profile || {});
    setError('');
  };

  const handleInputChange = (section: keyof WorkerProfile, field: string, value: any) => {
    setEditedData((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] as Record<string, any>),
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      const response = await wageService.updateWorkerProfile({
        personalInfo: editedData.personalInfo,
        addressInfo: editedData.addressInfo,
      });
      if (response) {
        setProfile(response);
        setIsEditing(false);
        setSuccess('Profile updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to update profile');
      console.error('Profile update error:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-12 h-12 text-blue-600 animate-spin" />
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">{error || 'Profile not found'}</p>
            <Button
              onClick={() => navigate('/worker/dashboard')}
              variant="primary"
            >
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/worker/dashboard')}
              className="p-2 hover:bg-white rounded-lg transition"
            >
              <ArrowLeft className="w-6 h-6 text-gray-700" />
            </button>
            <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
          </div>
          {!isEditing && (
            <Button
              onClick={handleEdit}
              variant="primary"
              size="md"
              className="flex items-center gap-2"
            >
              <Edit2 className="w-5 h-5" />
              Edit Profile
            </Button>
          )}
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-6">
            {success}
          </div>
        )}

        {/* Content */}
        <div className="space-y-6">
          {/* Personal Information */}
          <Card>
            <div className="border-b border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800">Personal Information</h2>
            </div>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedData.personalInfo?.firstName || ''}
                      onChange={(e) => handleInputChange('personalInfo', 'firstName', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700">
                      {profile.personalInfo?.firstName || 'N/A'}
                    </p>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedData.personalInfo?.lastName || ''}
                      onChange={(e) => handleInputChange('personalInfo', 'lastName', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700">
                      {profile.personalInfo?.lastName || 'N/A'}
                    </p>
                  )}
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth
                  </label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={editedData.personalInfo?.dateOfBirth?.split('T')[0] || ''}
                      onChange={(e) => handleInputChange('personalInfo', 'dateOfBirth', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700">
                      {profile.personalInfo?.dateOfBirth
                        ? new Date(profile.personalInfo.dateOfBirth).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  )}
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender
                  </label>
                  {isEditing ? (
                    <select
                      value={editedData.personalInfo?.gender || ''}
                      onChange={(e) => handleInputChange('personalInfo', 'gender', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  ) : (
                    <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700 capitalize">
                      {profile.personalInfo?.gender || 'N/A'}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Phone
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editedData.personalInfo?.phone || ''}
                      onChange={(e) => handleInputChange('personalInfo', 'phone', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700">
                      {profile.personalInfo?.phone}
                    </p>
                  )}
                </div>

                {/* Alternate Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alternate Phone
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={editedData.personalInfo?.alternatePhone || ''}
                      onChange={(e) => handleInputChange('personalInfo', 'alternatePhone', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700">
                      {profile.personalInfo?.alternatePhone || 'N/A'}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700">
                    {profile.personalInfo?.email}
                  </p>
                </div>

                {/* Occupation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Occupation
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedData.personalInfo?.occupation || ''}
                      onChange={(e) => handleInputChange('personalInfo', 'occupation', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700">
                      {profile.personalInfo?.occupation || 'N/A'}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Address Information */}
          <Card>
            <div className="border-b border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-800">Address Information</h2>
            </div>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Street */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedData.addressInfo?.street || ''}
                      onChange={(e) => handleInputChange('addressInfo', 'street', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700">
                      {profile.addressInfo?.street || 'N/A'}
                    </p>
                  )}
                </div>

                {/* City */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedData.addressInfo?.city || ''}
                      onChange={(e) => handleInputChange('addressInfo', 'city', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700">
                      {profile.addressInfo?.city || 'N/A'}
                    </p>
                  )}
                </div>

                {/* State */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedData.addressInfo?.state || ''}
                      onChange={(e) => handleInputChange('addressInfo', 'state', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700">
                      {profile.addressInfo?.state || 'N/A'}
                    </p>
                  )}
                </div>

                {/* Postal Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Postal Code
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedData.addressInfo?.postalCode || ''}
                      onChange={(e) => handleInputChange('addressInfo', 'postalCode', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700">
                      {profile.addressInfo?.postalCode || 'N/A'}
                    </p>
                  )}
                </div>

                {/* District */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    District
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedData.addressInfo?.district || ''}
                      onChange={(e) => handleInputChange('addressInfo', 'district', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  ) : (
                    <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700">
                      {profile.addressInfo?.district || 'N/A'}
                    </p>
                  )}
                </div>

                {/* Country */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <p className="px-4 py-2 bg-gray-50 rounded-lg text-gray-700">
                    {profile.addressInfo?.country || 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bank Accounts */}
          {profile.bankAccounts && profile.bankAccounts.length > 0 && (
            <Card>
              <div className="border-b border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-800">Bank Accounts</h2>
              </div>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {profile.bankAccounts.map((account) => (
                    <div key={account._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-semibold text-gray-800">{account.bankName}</p>
                          <p className="text-sm text-gray-600">
                            {account.accountHolderName}
                          </p>
                        </div>
                        {account.isDefault && (
                          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-600">Account Number</p>
                          <p className="text-sm font-mono text-gray-800">
                            ****{account.accountNumber.slice(-4)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">IFSC Code</p>
                          <p className="text-sm font-mono text-gray-800">{account.ifscCode}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Financial Info */}
          {profile.financialInfo && (
            <Card>
              <div className="border-b border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-800">Financial Information</h2>
              </div>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600">Total Earnings</p>
                    <p className="text-2xl font-bold text-gray-800">
                      ₹{profile.financialInfo.totalEarnings.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Current Balance</p>
                    <p className="text-2xl font-bold text-green-600">
                      ₹{profile.financialInfo.balance.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Annual Income</p>
                    <p className="text-2xl font-bold text-gray-800">
                      ₹{profile.financialInfo.annualIncome.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Income Category</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {profile.financialInfo.incomeCategory.toUpperCase()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex gap-4 justify-end">
              <Button
                onClick={handleCancel}
                disabled={saving}
                variant="secondary"
              >
                <X className="w-5 h-5 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                variant="primary"
              >
                <Save className="w-5 h-5 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
