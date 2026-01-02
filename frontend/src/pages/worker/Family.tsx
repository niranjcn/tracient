import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  ClipboardList,
  Home,
  Briefcase,
  GraduationCap,
  IndianRupee,
  Heart,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Shield,
  AlertTriangle,
  Award,
  Edit,
  UserPlus
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge, Spinner } from '@/components/common';
import { familyService } from '@/services';
import { Family, FamilyMember } from '@/types/family';
import { formatCurrency } from '@/utils/formatters';
import { useAuth } from '@/hooks/useAuth';

const FamilyPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isReclassifying, setIsReclassifying] = useState(false);
  const [family, setFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [requiresUpdate, setRequiresUpdate] = useState(false);
  const [actualMemberCount, setActualMemberCount] = useState(0);
  const [autoUpdated, setAutoUpdated] = useState(false);

  useEffect(() => {
    fetchFamilyData();
  }, []);

  const fetchFamilyData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await familyService.getMyFamily();
      console.log('📊 Family data received:', data);
      setFamily(data.family);
      setMembers(data.members || []);
      
      // Check if family needs updating
      const status = await familyService.checkSurveyStatus();
      console.log('📋 Survey status:', status);
      setRequiresUpdate(status.requiresUpdate || false);
      setActualMemberCount(status.actualMemberCount || 0);
      setAutoUpdated(status.autoUpdated || false);
      
      // If status says requires update or family object has flag set, show prompt
      if (data.family?.requires_update || status.requiresUpdate) {
        setRequiresUpdate(true);
      }
      
      if (status.autoUpdated) {
        // Refresh to get updated family size
        const updatedData = await familyService.getMyFamily();
        setFamily(updatedData.family);
      }
    } catch (err) {
      console.error('❌ Error fetching family:', err);
      setError(err instanceof Error ? err.message : 'Failed to load family data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReclassify = async () => {
    setIsReclassifying(true);
    setError(null);
    try {
      const response = await familyService.reclassifyFamily();
      console.log('✅ Reclassification successful:', response);
      // Refresh family data
      await fetchFamilyData();
    } catch (err) {
      console.error('❌ Reclassification error:', err);
      setError(err instanceof Error ? err.message : 'Failed to reclassify family');
    } finally {
      setIsReclassifying(false);
    }
  };

  const handleStartSurvey = () => {
    navigate(user?.role === 'worker' ? '/worker/family/survey' : '/employer/family/survey');
  };
  
  const handleUpdateFamily = () => {
    navigate(user?.role === 'worker' ? '/worker/family/update' : '/employer/family/update', {
      state: { family, requiresUpdate, actualMemberCount }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading family information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Family Data</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={fetchFamilyData}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!family) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ClipboardList className="h-10 w-10 text-primary-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Survey Available</h2>
            <p className="text-gray-600 mb-2">
              Complete the family survey to register your household information.
            </p>
            <p className="text-sm text-gray-500 mb-8">
              This information is essential for determining welfare benefit eligibility and will be shared with all family members.
            </p>
            <Button size="lg" onClick={handleStartSurvey} className="gap-2">
              <ClipboardList className="h-5 w-5" />
              Start Family Survey
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getEducationLevel = (code: number): string => {
    const levels = [
      'No Education',
      'Primary (1-5)',
      'Middle (6-8)',
      'Secondary (9-10)',
      'Higher Secondary (11-12)',
      'Graduate',
      'Post Graduate',
      'Professional'
    ];
    return levels[code] || 'Unknown';
  };

  const getHouseTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      houseless: 'Houseless',
      temporary_plastic: 'Temporary/Plastic',
      kucha: 'Kucha',
      semi_pucca: 'Semi-Pucca',
      pucca: 'Pucca'
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Family Information</h1>
          <p className="text-gray-600 mt-1">Ration Card: {family.ration_no}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={handleUpdateFamily} 
            variant="outline"
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Update Family
          </Button>
          <Badge variant="success" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Survey Completed
          </Badge>
        </div>
      </div>

      {/* New Member Detection Alert */}
      {requiresUpdate && (
        <Card className="border-2 border-blue-300 bg-blue-50">
          <CardContent className="py-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-blue-200">
                <UserPlus className="h-6 w-6 text-blue-700" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-blue-900 mb-2">
                  {autoUpdated ? 'New Family Member Detected!' : 'Family Update Required'}
                </h3>
                <p className="text-sm text-blue-800 mb-3">
                  {autoUpdated ? (
                    <>
                      We've detected that {actualMemberCount} user(s) now share your ration number, 
                      but your family survey showed only {family.family_size} member(s). 
                      We've automatically updated the family size to {actualMemberCount}.
                    </>
                  ) : (
                    <>
                      Your family demographics need to be updated to reflect recent changes. 
                      This ensures accurate welfare benefit calculations.
                    </>
                  )}
                </p>
                <p className="text-sm text-blue-800 mb-4">
                  Please update your family demographics to reflect the current household composition 
                  for accurate welfare benefit calculations.
                </p>
                <Button 
                  onClick={handleUpdateFamily}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Update Family Details Now
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Classification Notice */}
      {(!family.classification || family.classification === 'pending') && (
        <Card className="border-2 border-gray-300 bg-gray-50">
          <CardContent className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-full bg-gray-200">
                  <Loader2 className="h-8 w-8 text-gray-500 animate-spin" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-700">Classification Pending</h2>
                  <p className="text-sm text-gray-500">
                    Your APL/BPL classification is being processed. Click the button to run classification now.
                  </p>
                </div>
              </div>
              <Button 
                onClick={handleReclassify} 
                disabled={isReclassifying}
                className="flex items-center gap-2"
              >
                {isReclassifying ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Classifying...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4" />
                    Run Classification
                  </>
                )}
              </Button>
            </div>
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Family Members */}
      {members.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary-600" />
              Family Members ({members.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.map((member) => (
                <div key={member.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <p className="font-medium text-gray-900">{member.name}</p>
                  <p className="text-sm text-gray-600">{member.email}</p>
                  {member.phone && <p className="text-sm text-gray-500">{member.phone}</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Demographics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary-600" />
            Family Demographics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-600">Family Size</p>
              <p className="text-2xl font-bold text-gray-900">{family.family_size}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Head Age</p>
              <p className="text-2xl font-bold text-gray-900">{family.head_age} years</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Working Members</p>
              <p className="text-2xl font-bold text-gray-900">{family.working_members}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Children (0-14)</p>
              <p className="text-2xl font-bold text-gray-900">{family.children_0_6 + family.children_6_14}</p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Age Distribution</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-600">Children 0-6</p>
                <p className="text-lg font-semibold text-blue-900">{family.children_0_6}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-green-600">Children 6-14</p>
                <p className="text-lg font-semibold text-green-900">{family.children_6_14}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="text-xs text-purple-600">Adults 16-59</p>
                <p className="text-lg font-semibold text-purple-900">{family.adults_16_59}</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <p className="text-xs text-orange-600">Elderly 60+</p>
                <p className="text-lg font-semibold text-orange-900">{family.elderly_60_plus}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Additional Details</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Male Adults (16-59)</p>
                <p className="font-medium text-gray-900">{family.adult_males_16_59}</p>
              </div>
              <div>
                <p className="text-gray-600">Female Adults (16-59)</p>
                <p className="font-medium text-gray-900">{family.adult_females_16_59}</p>
              </div>
              <div>
                <p className="text-gray-600">Able-bodied Adults</p>
                <p className="font-medium text-gray-900">{family.able_bodied_adults}</p>
              </div>
              <div>
                <p className="text-gray-600">Literate Adults 25+</p>
                <p className="font-medium text-gray-900">{family.literate_adults_above_25}</p>
              </div>
              <div>
                <p className="text-gray-600">Children in School</p>
                <p className="font-medium text-gray-900">{family.children_in_school}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Household Type & Income */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary-600" />
              Household Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {family.is_female_headed === 1 && (
                <Badge variant="info">Female-headed Household</Badge>
              )}
              {family.is_pvtg === 1 && (
                <Badge variant="warning">Primitive Tribal Group (PVTG)</Badge>
              )}
              {family.is_minority === 1 && (
                <Badge variant="info">Religious Minority</Badge>
              )}
              {family.is_informal === 1 && (
                <Badge variant="secondary">Informal Sector Employment</Badge>
              )}
              {!family.is_female_headed && !family.is_pvtg && !family.is_minority && !family.is_informal && (
                <p className="text-sm text-gray-600">No special category</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IndianRupee className="h-5 w-5 text-primary-600" />
              Income & Education
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Highest Monthly Income</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(family.highest_earner_monthly)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Highest Education Level</p>
                <p className="font-medium text-gray-900">{getEducationLevel(family.education_code)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Land & Agriculture */}
      {family.total_land_acres > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary-600" />
              Land & Agriculture
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-600">Total Land</p>
                <p className="text-xl font-bold text-gray-900">{family.total_land_acres} acres</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Irrigated Land</p>
                <p className="text-xl font-bold text-gray-900">{family.irrigated_land_acres} acres</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Crop Seasons</p>
                <p className="text-xl font-bold text-gray-900">{family.crop_seasons}/year</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assets */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5 text-primary-600" />
            Assets Owned
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Two-wheeler', value: family.owns_two_wheeler },
              { label: 'Four-wheeler', value: family.owns_four_wheeler },
              { label: 'Tractor', value: family.owns_tractor },
              { label: 'Mechanized Equipment', value: family.owns_mechanized_equipment },
              { label: 'Refrigerator', value: family.owns_refrigerator },
              { label: 'Landline', value: family.owns_landline },
              { label: 'Television', value: family.owns_tv },
              { label: 'Mobile Phone', value: family.owns_mobile },
            ].map((asset) => (
              <div
                key={asset.label}
                className={`p-3 rounded-lg border ${
                  asset.value ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <p className="text-sm text-gray-700">{asset.label}</p>
                <p className={`text-xs font-medium ${asset.value ? 'text-green-700' : 'text-gray-500'}`}>
                  {asset.value ? 'Yes' : 'No'}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Housing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5 text-primary-600" />
            Housing Conditions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600">House Type</p>
              <p className="text-lg font-semibold text-gray-900">{getHouseTypeLabel(family.house_type)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Number of Rooms</p>
              <p className="text-lg font-semibold text-gray-900">{family.num_rooms}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Houseless Status</p>
              <Badge variant={family.is_houseless ? 'error' : 'success'}>
                {family.is_houseless ? 'Yes' : 'No'}
              </Badge>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">Basic Amenities</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Electricity', value: family.has_electricity },
                { label: 'Water Tap', value: family.has_water_tap },
                { label: 'Toilet', value: family.has_toilet },
              ].map((amenity) => (
                <div
                  key={amenity.label}
                  className={`p-4 rounded-lg border ${
                    amenity.value ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}
                >
                  <p className="text-sm font-medium text-gray-900">{amenity.label}</p>
                  <Badge variant={amenity.value ? 'success' : 'error'} className="mt-2">
                    {amenity.value ? 'Available' : 'Not Available'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary-600" />
            Financial Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`p-4 rounded-lg border ${family.has_bank_account ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
              <p className="text-sm text-gray-700">Bank Account</p>
              <p className={`text-xs font-medium mt-1 ${family.has_bank_account ? 'text-green-700' : 'text-gray-500'}`}>
                {family.has_bank_account ? 'Yes' : 'No'}
              </p>
            </div>
            <div className={`p-4 rounded-lg border ${family.has_savings ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
              <p className="text-sm text-gray-700">Savings</p>
              <p className={`text-xs font-medium mt-1 ${family.has_savings ? 'text-green-700' : 'text-gray-500'}`}>
                {family.has_savings ? 'Yes' : 'No'}
              </p>
            </div>
            <div className={`p-4 rounded-lg border ${family.has_loan ? 'bg-yellow-50 border-yellow-200' : 'bg-gray-50 border-gray-200'}`}>
              <p className="text-sm text-gray-700">Active Loan</p>
              <p className={`text-xs font-medium mt-1 ${family.has_loan ? 'text-yellow-700' : 'text-gray-500'}`}>
                {family.has_loan ? 'Yes' : 'No'}
              </p>
            </div>
            {family.has_loan && (
              <div className="p-4 rounded-lg border bg-blue-50 border-blue-200">
                <p className="text-sm text-gray-700">Loan Source</p>
                <p className="text-xs font-medium mt-1 text-blue-700 capitalize">
                  {family.loan_source.replace('_', ' ')}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FamilyPage;
