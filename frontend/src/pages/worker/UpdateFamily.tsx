import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, CheckCircle2, Users, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { familyService } from '@/services';
import { Card, CardHeader, CardTitle, CardContent, Button, Alert } from '@/components/common';
import { Family, FamilySurveyData, ClassificationResult } from '@/types/family';
import ClassificationResultModal from '@/components/family/ClassificationResultModal';
import { toast } from 'react-hot-toast';

interface LocationState {
  family: Family;
  requiresUpdate: boolean;
  actualMemberCount: number;
}

interface FormErrors {
  [key: string]: string;
}

const UpdateFamily: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const state = location.state as LocationState;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showClassificationResult, setShowClassificationResult] = useState(false);
  const [classificationResult, setClassificationResult] = useState<ClassificationResult | null>(null);
  const [formData, setFormData] = useState<Partial<FamilySurveyData>>({});

  useEffect(() => {
    if (!state?.family) {
      // If no family state, fetch it
      fetchFamily();
    } else {
      // Initialize form data from existing family
      const family = state.family;
      setFormData({
        family_size: family.family_size,
        head_age: family.head_age,
        children_0_6: family.children_0_6,
        children_6_14: family.children_6_14,
        adults_16_59: family.adults_16_59,
        adult_males_16_59: family.adult_males_16_59,
        adult_females_16_59: family.adult_females_16_59,
        adult_other_16_59: family.adult_other_16_59,
        elderly_60_plus: family.elderly_60_plus,
        able_bodied_adults: family.able_bodied_adults,
        working_members: family.working_members,
        literate_adults_above_25: family.literate_adults_above_25,
        children_in_school: family.children_in_school,
        education_code: family.education_code,
        highest_earner_monthly: family.highest_earner_monthly,
        is_female_headed: family.is_female_headed,
        is_pvtg: family.is_pvtg,
        is_minority: family.is_minority,
        is_informal: family.is_informal,
      });
    }
  }, [state]);

  const fetchFamily = async () => {
    try {
      const data = await familyService.getMyFamily();
      if (data.family) {
        const family = data.family;
        setFormData({
          family_size: family.family_size,
          head_age: family.head_age,
          children_0_6: family.children_0_6,
          children_6_14: family.children_6_14,
          adults_16_59: family.adults_16_59,
          adult_males_16_59: family.adult_males_16_59,
          adult_females_16_59: family.adult_females_16_59,
          adult_other_16_59: family.adult_other_16_59,
          elderly_60_plus: family.elderly_60_plus,
          able_bodied_adults: family.able_bodied_adults,
          working_members: family.working_members,
          literate_adults_above_25: family.literate_adults_above_25,
          children_in_school: family.children_in_school,
          education_code: family.education_code,
          highest_earner_monthly: family.highest_earner_monthly,
          is_female_headed: family.is_female_headed,
          is_pvtg: family.is_pvtg,
          is_minority: family.is_minority,
          is_informal: family.is_informal,
        });
      }
    } catch (error) {
      console.error('Error fetching family:', error);
      toast.error('Failed to load family data');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value
    }));
    
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked ? 1 : 0
    }));
  };

  const validateAgeGroups = (): boolean => {
    const total = (formData.children_0_6 || 0) + 
                  (formData.children_6_14 || 0) + 
                  (formData.adults_16_59 || 0) + 
                  (formData.elderly_60_plus || 0);
    
    if (total !== (formData.family_size || 0)) {
      setErrors({ 
        ageGroups: `Age groups (${total}) must add up to total family members (${formData.family_size || 0})` 
      });
      toast.error('Age groups must add up to total family members');
      return false;
    }
    
    // Validate adult males + females + other = total adults
    const totalAdults = (formData.adult_males_16_59 || 0) + (formData.adult_females_16_59 || 0) + (formData.adult_other_16_59 || 0);
    const adultsCount = formData.adults_16_59 || 0;
    
    if (adultsCount > 0 && totalAdults === 0) {
      setErrors({ 
        adults: `You have ${adultsCount} adult(s) but no gender breakdown. Please specify Male, Female, or Other.` 
      });
      toast.error('Adult gender breakdown is required when adults are present');
      return false;
    }
    
    if (totalAdults !== adultsCount) {
      setErrors({ 
        adults: `Adult males (${formData.adult_males_16_59 || 0}) + females (${formData.adult_females_16_59 || 0}) + other (${formData.adult_other_16_59 || 0}) must equal total adults (${adultsCount})` 
      });
      toast.error('Adult gender breakdown must equal total adults');
      return false;
    }
    
    // Validate working members doesn't exceed able-bodied adults
    if ((formData.working_members || 0) > (formData.able_bodied_adults || 0)) {
      setErrors({ 
        working: `Working members (${formData.working_members}) cannot exceed able-bodied adults (${formData.able_bodied_adults})` 
      });
      toast.error('Working members cannot exceed able-bodied adults');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!state?.family?.ration_no) {
      toast.error('No ration number found');
      return;
    }
    
    // Validate demographics
    if (!validateAgeGroups()) {
      return;
    }
    
    setIsSubmitting(true);
    setErrors({});
    
    try {
      const response = await familyService.updateFamily(state.family.ration_no, formData, true);
      
      toast.success('Family details updated successfully!');
      
      // Check if classification result is available
      if (response.classification) {
        setClassificationResult(response.classification);
        setShowClassificationResult(true);
      } else {
        navigate(user?.role === 'worker' ? '/worker/family' : '/employer/family');
      }
    } catch (error) {
      console.error('Update error:', error);
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to update family' });
      toast.error('Failed to update family details');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClassificationClose = () => {
    setShowClassificationResult(false);
    navigate(user?.role === 'worker' ? '/worker/family' : '/employer/family');
  };

  return (
    <>
      <ClassificationResultModal
        isOpen={showClassificationResult}
        onClose={handleClassificationClose}
        result={classificationResult}
        onContinue={handleClassificationClose}
      />
      
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => navigate(user?.role === 'worker' ? '/worker/family' : '/employer/family')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-6 w-6 text-primary-600" />
                  Update Family Information
                </CardTitle>
                <p className="text-sm text-gray-600 mt-2">
                  Update your family demographics and household details
                </p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {state?.requiresUpdate && state?.actualMemberCount && (
              <Alert variant="info" className="mb-6">
                <AlertCircle className="h-5 w-5" />
                <div>
                  <strong>New member(s) detected!</strong>
                  <p className="text-sm mt-1">
                    Your family now has {state.actualMemberCount} registered members. 
                    Please update the demographics below to reflect any changes.
                  </p>
                </div>
              </Alert>
            )}

            {errors.submit && (
              <Alert variant="error" className="mb-6">
                <AlertCircle className="h-5 w-5" />
                {errors.submit}
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Demographics */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Family Members *
                    </label>
                    <input
                      type="number"
                      name="family_size"
                      value={formData.family_size || 1}
                      onChange={handleChange}
                      min="1"
                      max="20"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      required
                    />
                    {state?.actualMemberCount && formData.family_size !== state.actualMemberCount && (
                      <p className="text-xs text-amber-600 mt-1">
                        ⚠️ {state.actualMemberCount} users registered with this ration number
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Make sure age groups below add up to this total</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Age of Household Head
                    </label>
                    <input
                      type="number"
                      name="head_age"
                      value={formData.head_age || 18}
                      onChange={handleChange}
                      min="18"
                      max="100"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Highest Monthly Income (₹)
                    </label>
                    <input
                      type="number"
                      name="highest_earner_monthly"
                      value={formData.highest_earner_monthly || 0}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Highest Education Level
                    </label>
                    <select
                      name="education_code"
                      value={formData.education_code || 0}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="0">No Education</option>
                      <option value="1">Primary (1-5)</option>
                      <option value="2">Middle (6-8)</option>
                      <option value="3">Secondary (9-10)</option>
                      <option value="4">Higher Secondary (11-12)</option>
                      <option value="5">Graduate</option>
                      <option value="6">Post Graduate</option>
                      <option value="7">Professional</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Age Group Demographics */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Age Group Demographics</h3>
                  <div className="text-sm">
                    <span className="text-gray-600">Total: </span>
                    <span className={`font-bold ${
                      ((formData.children_0_6 || 0) + (formData.children_6_14 || 0) + (formData.adults_16_59 || 0) + (formData.elderly_60_plus || 0)) === (formData.family_size || 0)
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}>
                      {(formData.children_0_6 || 0) + (formData.children_6_14 || 0) + (formData.adults_16_59 || 0) + (formData.elderly_60_plus || 0)} / {formData.family_size || 0}
                    </span>
                  </div>
                </div>
                {errors.ageGroups && (
                  <Alert variant="error" className="py-2">
                    <AlertCircle className="h-4 w-4" />
                    {errors.ageGroups}
                  </Alert>
                )}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Children (0-6 years)
                    </label>
                    <input
                      type="number"
                      name="children_0_6"
                      value={formData.children_0_6 || 0}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Children (6-14 years)
                    </label>
                    <input
                      type="number"
                      name="children_6_14"
                      value={formData.children_6_14 || 0}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Children in School
                    </label>
                    <input
                      type="number"
                      name="children_in_school"
                      value={formData.children_in_school || 0}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adults (16-59 years)
                    </label>
                    <input
                      type="number"
                      name="adults_16_59"
                      value={formData.adults_16_59 || 0}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adult Males (16-59)
                    </label>
                    <input
                      type="number"
                      name="adult_males_16_59"
                      value={formData.adult_males_16_59 || 0}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adult Females (16-59)
                    </label>
                    <input
                      type="number"
                      name="adult_females_16_59"
                      value={formData.adult_females_16_59 || 0}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Adult Other (16-59)
                    </label>
                    <input
                      type="number"
                      name="adult_other_16_59"
                      value={formData.adult_other_16_59 || 0}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Non-binary/other gender identities</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Elderly (60+ years)
                    </label>
                    <input
                      type="number"
                      name="elderly_60_plus"
                      value={formData.elderly_60_plus || 0}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                
                <div className="text-sm px-1">
                  <span className="text-gray-600">Gender breakdown: </span>
                  <span className={`font-bold ${
                    ((formData.adult_males_16_59 || 0) + (formData.adult_females_16_59 || 0) + (formData.adult_other_16_59 || 0)) === (formData.adults_16_59 || 0)
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {(formData.adult_males_16_59 || 0)} M + {(formData.adult_females_16_59 || 0)} F + {(formData.adult_other_16_59 || 0)} O = {(formData.adult_males_16_59 || 0) + (formData.adult_females_16_59 || 0) + (formData.adult_other_16_59 || 0)} / {formData.adults_16_59 || 0}
                  </span>
                </div>
                
                {errors.adults && (
                  <Alert variant="error" className="py-2">
                    <AlertCircle className="h-4 w-4" />
                    {errors.adults}
                  </Alert>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Able-bodied Adults
                    </label>
                    <input
                      type="number"
                      name="able_bodied_adults"
                      value={formData.able_bodied_adults || 0}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">Adults who can work</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Working Members
                    </label>
                    <input
                      type="number"
                      name="working_members"
                      value={formData.working_members || 0}
                      onChange={handleChange}
                      min="0"
                      max={formData.able_bodied_adults || 0}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Cannot exceed able-bodied adults ({formData.able_bodied_adults || 0})
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Literate Adults (25+)
                    </label>
                    <input
                      type="number"
                      name="literate_adults_above_25"
                      value={formData.literate_adults_above_25 || 0}
                      onChange={handleChange}
                      min="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>
                
                {errors.working && (
                  <Alert variant="error" className="py-2">
                    <AlertCircle className="h-4 w-4" />
                    {errors.working}
                  </Alert>
                )}
              </div>

              {/* Household Type */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Household Type</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_female_headed"
                      checked={formData.is_female_headed === 1}
                      onChange={(e) => handleCheckboxChange('is_female_headed', e.target.checked)}
                      className="rounded text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm">Female-headed</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_pvtg"
                      checked={formData.is_pvtg === 1}
                      onChange={(e) => handleCheckboxChange('is_pvtg', e.target.checked)}
                      className="rounded text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm">PVTG</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_minority"
                      checked={formData.is_minority === 1}
                      onChange={(e) => handleCheckboxChange('is_minority', e.target.checked)}
                      className="rounded text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm">Minority</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_informal"
                      checked={formData.is_informal === 1}
                      onChange={(e) => handleCheckboxChange('is_informal', e.target.checked)}
                      className="rounded text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm">Informal Sector</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4 pt-6 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(user?.role === 'worker' ? '/worker/family' : '/employer/family')}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating & Reclassifying...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Update Family
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default UpdateFamily;
