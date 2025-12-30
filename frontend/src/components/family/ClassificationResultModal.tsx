import React from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  TrendingUp,
  Shield,
  Home,
  Heart,
  Award,
  Info,
  X
} from 'lucide-react';
import { Button } from '@/components/common';
import { ClassificationResult } from '@/types/family';

interface ClassificationResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: ClassificationResult | null;
  onContinue: () => void;
}

const ClassificationResultModal: React.FC<ClassificationResultModalProps> = ({
  isOpen,
  onClose,
  result,
  onContinue
}) => {
  if (!isOpen || !result) return null;

  const isBPL = result.classification === 'BPL';
  const confidence = result.ml_prediction?.confidence || 0;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose} />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className={`relative px-6 py-8 rounded-t-2xl ${isBPL ? 'bg-gradient-to-br from-orange-500 to-red-600' : 'bg-gradient-to-br from-green-500 to-emerald-600'}`}>
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-white/80 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
            
            <div className="text-center text-white">
              <div className="flex justify-center mb-4">
                {isBPL ? (
                  <div className="p-4 bg-white/20 rounded-full">
                    <AlertTriangle className="h-12 w-12" />
                  </div>
                ) : (
                  <div className="p-4 bg-white/20 rounded-full">
                    <CheckCircle2 className="h-12 w-12" />
                  </div>
                )}
              </div>
              <h2 className="text-3xl font-bold mb-2">
                {isBPL ? 'Below Poverty Line (BPL)' : 'Above Poverty Line (APL)'}
              </h2>
              <p className="text-white/90 text-lg">{result.reason}</p>
              
              {confidence > 0 && (
                <div className="mt-4 inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-2">
                  <TrendingUp className="h-4 w-4" />
                  <span className="font-semibold">{confidence}% Confidence</span>
                </div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-6">
            {/* ML Prediction Details */}
            {result.ml_prediction && (
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-500" />
                  AI Model Prediction
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {result.ml_prediction.bpl_probability}%
                    </div>
                    <div className="text-sm text-gray-600">BPL Probability</div>
                  </div>
                  <div className="text-center p-3 bg-white rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {result.ml_prediction.apl_probability}%
                    </div>
                    <div className="text-sm text-gray-600">APL Probability</div>
                  </div>
                </div>
              </div>
            )}

            {/* SECC Analysis */}
            {result.secc_analysis && (
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Info className="h-5 w-5 text-purple-500" />
                  SECC 2011 Criteria Analysis
                </h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Classification:</span>
                    <span className={`font-semibold ${result.secc_analysis.secc_classification === 'BPL' ? 'text-red-600' : 'text-green-600'}`}>
                      {result.secc_analysis.secc_classification}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Deprivation Indicators:</span>
                    <span className="font-semibold">{result.secc_analysis.deprivation_count}</span>
                  </div>
                </div>

                {/* Inclusion Criteria Met */}
                {result.secc_analysis.inclusion_met.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-green-700 mb-2">✅ Inclusion Criteria Met:</h4>
                    <ul className="space-y-1">
                      {result.secc_analysis.inclusion_met.map((criteria, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          {criteria}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Exclusion Criteria Met */}
                {result.secc_analysis.exclusion_met.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-red-700 mb-2">❌ Exclusion Criteria Met:</h4>
                    <ul className="space-y-1">
                      {result.secc_analysis.exclusion_met.map((criteria, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-500" />
                          {criteria}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Deprivation Indicators */}
                {result.secc_analysis.deprivation_met.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-orange-700 mb-2">⚠️ Deprivation Indicators:</h4>
                    <ul className="space-y-1">
                      {result.secc_analysis.deprivation_met.map((indicator, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                          {indicator}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Recommendation */}
            {result.recommendation && (
              <div className={`rounded-xl p-4 ${
                result.recommendation.priority === 'HIGH' ? 'bg-red-50 border border-red-200' :
                result.recommendation.priority === 'MEDIUM' ? 'bg-orange-50 border border-orange-200' :
                'bg-green-50 border border-green-200'
              }`}>
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Award className={`h-5 w-5 ${
                    result.recommendation.priority === 'HIGH' ? 'text-red-500' :
                    result.recommendation.priority === 'MEDIUM' ? 'text-orange-500' :
                    'text-green-500'
                  }`} />
                  Recommendation
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    result.recommendation.priority === 'HIGH' ? 'bg-red-200 text-red-800' :
                    result.recommendation.priority === 'MEDIUM' ? 'bg-orange-200 text-orange-800' :
                    'bg-green-200 text-green-800'
                  }`}>
                    {result.recommendation.priority} Priority
                  </span>
                </h3>
                <p className="text-gray-700">{result.recommendation.message}</p>
              </div>
            )}

            {/* Eligible Schemes */}
            {result.recommendation?.eligible_schemes && result.recommendation.eligible_schemes.length > 0 && (
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <Heart className="h-5 w-5 text-blue-500" />
                  Eligible Welfare Schemes
                </h3>
                <ul className="space-y-2">
                  {result.recommendation.eligible_schemes.map((scheme, index) => (
                    <li key={index} className="flex items-center gap-2 text-blue-800">
                      <CheckCircle2 className="h-4 w-4 text-blue-500" />
                      {scheme}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={onContinue}>
              <Home className="h-4 w-4 mr-2" />
              Go to Family Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassificationResultModal;
