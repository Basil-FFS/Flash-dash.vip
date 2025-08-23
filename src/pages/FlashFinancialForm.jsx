import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../api.js';

const schema = z.object({
  Fname: z.string().min(1, 'First name is required'),
  Lname: z.string().min(1, 'Last name is required'),
  phone: z.string().min(10, 'Phone number is required').max(12, 'Phone number too long'),
  email: z.string().email('Valid email is required'),
  address: z.string().min(3, 'Address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().length(2, 'State is required'),
  zip: z.string().regex(/^\d{5}$/, 'ZIP must be 5 digits'),
  employment_status: z.string().min(1, 'Employment status is required'),
  monthly_income: z.string().min(1, 'Monthly income is required'),
  soft_credit_permission: z.boolean(),
  DOB: z.string().min(8, 'Date of birth is required').max(10, 'Date of birth too long'),
  SSN: z.string().length(4, 'SSN must be exactly 4 digits'),
  total_unsecured_debt: z.string().min(1, 'Total unsecured debt is required')
});

const states = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'];

export default function FlashFinancialForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [fileNumber, setFileNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm({ 
    resolver: zodResolver(schema),
    defaultValues: {
      soft_credit_permission: false,
      SSN: ''
    }
  });

  const firstName = watch('Fname') || '';
  const agentName = localStorage.getItem('agentName') || 'Agent';

  // Phone number masking
  function maskPhone(value) {
    const digits = value.replace(/\D/g, '').slice(0, 10);
    if (digits.length === 0) return '';
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  // DOB masking
  function maskDOB(value) {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    if (digits.length === 0) return '';
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  }

  // SSN masking (only last 4 digits)
  function maskSSN(value) {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    return digits;
  }

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setError('');
    
    try {
      // Format data for ForthCRM
      const forthData = {
        address: data.address,
        city: data.city,
        DOB: data.DOB,
        email: data.email,
        employment_status: data.employment_status,
        Fname: data.Fname,
        Lname: data.Lname,
        monthly_income: parseFloat(data.monthly_income.replace(/[$,]/g, '')),
        phone: data.phone,
        SSN: `000-00-${data.SSN}`,
        state: data.state,
        total_unsecured_debt: data.total_unsecured_debt.replace(/[$,]/g, ''),
        zip: data.zip
      };

      // Use backend proxy to avoid CORS
      const response = await api.post('/submissions/submit-lead', forthData);

      if (response.data) {
        // Parse Forth file number from response - try multiple possible formats
        let extractedFileNumber = null;
        
        // Method 1: Direct string response "Success:1136980487"
        if (typeof response.data === 'string' && response.data.startsWith('Success:')) {
          extractedFileNumber = response.data.replace('Success:', '');
        }
        // Method 2: Object with message field containing "Success:1136980487"
        else if (response.data.message && typeof response.data.message === 'string' && response.data.message.startsWith('Success:')) {
          extractedFileNumber = response.data.message.replace('Success:', '');
        }
        // Method 3: Object with file_number field
        else if (response.data.file_number) {
          extractedFileNumber = response.data.file_number;
        }
        // Method 4: Check if any field contains "Success:" pattern
        else {
          for (const [key, value] of Object.entries(response.data)) {
            if (typeof value === 'string' && value.startsWith('Success:')) {
              extractedFileNumber = value.replace('Success:', '');
              break;
            }
          }
        }
        
        // Method 5: If response was successful but no file number found, check if backend might have returned it differently
        if (!extractedFileNumber && response.status === 200) {
          // Sometimes the backend might return the file number in the response headers or as a different field
          if (response.headers && response.headers['x-forth-file-number']) {
            extractedFileNumber = response.headers['x-forth-file-number'];
          }
        }
        
        if (extractedFileNumber) {
          setFileNumber(extractedFileNumber);
        } else {
          setFileNumber('Generated');
        }
        
        setIsSubmitted(true);
      } else {
        throw new Error('No response data received');
      }
    } catch (err) {
      if (err.response?.data?.error) {
        setError(`Submission failed: ${err.response.data.error}`);
      } else {
        setError('Failed to submit application. Please try again.');
      }
      console.error('Submission error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-emerald-50 flex items-center justify-center p-4">
        <div className="card max-w-2xl w-full text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl text-white">✓</span>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Application Submitted Successfully!
          </h1>
          
          <div className="bg-gradient-to-r from-teal-50 to-emerald-50 p-6 rounded-2xl mb-8 border border-teal-100">
            <p className="text-lg text-gray-700 mb-4 leading-relaxed">
              <strong>Thank you {firstName},</strong> I've gone ahead and started an application for you. 
              We'll go over your expenses and your credit to see what options we can get you qualified for.
            </p>
            
            <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-semibold rounded-2xl text-lg shadow-lg">
              🎯 Forth File Number: <span className="ml-2 font-mono">{fileNumber}</span>
            </div>
          </div>
          
          <button 
            onClick={() => {
              setIsSubmitted(false);
              setFileNumber('');
              window.location.reload();
            }}
            className="btn-primary text-lg px-8 py-4"
          >
            🚀 Submit Another Application
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="gradient-bg rounded-3xl p-8 text-white shadow-2xl text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          FlashDash Lead Intake
        </h1>
        <p className="text-xl text-teal-100 max-w-2xl mx-auto">
          Please fill out the form below to submit a lead to Forth.
        </p>
      </div>

      {/* Enhanced Conversation Script Hero Section */}
      <div className="bg-gradient-to-br from-teal-600 via-emerald-600 to-teal-700 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        
        <div className="relative z-10">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4">
              <span className="text-3xl">📞</span>
            </div>
            <h2 className="text-3xl font-bold mb-2">Conversation Script</h2>
            <p className="text-teal-100 text-lg">Use this script to guide your conversation with the client</p>
          </div>
          
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <p className="text-lg leading-relaxed">
                <strong className="text-yellow-300"></strong> "Thank you for calling FlashDash, my name is{' '}
                <span className="text-yellow-300 font-bold text-xl">{agentName}</span>{' '}
                and we are on a recorded line. To whom do I have the pleasure of speaking with?"
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <p className="text-lg leading-relaxed">
                <strong className="text-yellow-300"></strong> "Hello{' '}
                <span className="text-yellow-300 font-bold text-xl">{firstName || '[Name]'}</span>{' '}
                , how much debt are you calling about today?"
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="card">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Total Unsecured Debt */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900">
                How much debt are you calling about today?
              </h3>
            </div>
            <input
              {...register('total_unsecured_debt')}
              placeholder="$15,000"
              className="input-field text-lg"
            />
            {errors.total_unsecured_debt && (
              <p className="text-red-600 text-sm font-medium">
                ⚠️ {errors.total_unsecured_debt.message}
              </p>
            )}
          </div>

          {/* Information Verification Script */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-2xl border-l-4 border-teal-500">
            <p className="text-lg text-gray-700 font-medium text-center leading-relaxed">
              <strong></strong> "Hopefully that's something we'll be able to help you with. To best service your needs I'm going to go ahead and verify some basic information so that we can proceed with your application."
            </p>
          </div>

          {/* Personal Information */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-900 border-b border-gray-200 pb-2">
              Personal Information
            </h3>
            
            {/* Name Fields - Side by Side */}
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-xl border-l-4 border-teal-500">
                <p className="text-gray-700 font-medium"> 
                  <strong>2.</strong> Go ahead with the spelling of your first and last name.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">First Name *</label>
                  <input
                    {...register('Fname')}
                    placeholder="First Name"
                    className="input-field"
                  />
                  {errors.Fname && (
                    <p className="text-red-600 text-sm">⚠️ {errors.Fname.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Last Name *</label>
                  <input
                    {...register('Lname')}
                    placeholder="Last Name"
                    className="input-field"
                  />
                  {errors.Lname && (
                    <p className="text-red-600 text-sm">⚠️ {errors.Lname.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Phone Number - Vertical */}
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-xl border-l-4 border-teal-500">
                <p className="text-gray-700 font-medium">
                  <strong>3.</strong> Is this the best phone number to reach you at?
                </p>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Phone Number *</label>
                <input
                  {...register('phone')}
                  placeholder="555-555-1234"
                  onInput={(e) => {
                    e.target.value = maskPhone(e.target.value);
                  }}
                  className="input-field"
                />
                {errors.phone && (
                  <p className="text-red-600 text-sm">⚠️ {errors.phone.message}</p>
                )}
              </div>
            </div>
            
            {/* Email Address - Vertical */}
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-xl border-l-4 border-teal-500">
                <p className="text-gray-700 font-medium">
                  <strong>4.</strong> What is your Email Address?
                </p>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Email Address *</label>
                <input
                  type="email"
                  {...register('email')}
                  placeholder="john.doe@email.com"
                  className="input-field"
                />
                {errors.email && (
                  <p className="text-red-600 text-sm">⚠️ {errors.email.message}</p>
                )}
              </div>
            </div>

            {/* Street Address - Vertical */}
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-xl border-l-4 border-teal-500">
                <p className="text-gray-700 font-medium">
                  And your home address?
                </p>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Street Address *</label>
                <input
                  {...register('address')}
                  placeholder="123 Main Street"
                  className="input-field"
                />
                {errors.address && (
                  <p className="text-red-600 text-sm">⚠️ {errors.address.message}</p>
                )}
              </div>
            </div>
            
            {/* City/State/ZIP - Side by Side */}
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-xl border-l-4 border-teal-500">
                <p className="text-gray-700 font-medium">
                  City, State, and ZIP Code
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">City *</label>
                  <input
                    {...register('city')}
                    placeholder="City"
                    className="input-field"
                  />
                  {errors.city && (
                    <p className="text-red-600 text-sm">⚠️ {errors.city.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">State *</label>
                  <select
                    {...register('state')}
                    className="input-field"
                  >
                    <option value="">State</option>
                    {states.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                  {errors.state && (
                    <p className="text-red-600 text-sm">⚠️ {errors.state.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">ZIP Code *</label>
                  <input
                    {...register('zip')}
                    placeholder="12345"
                    maxLength={5}
                    className="input-field"
                  />
                  {errors.zip && (
                    <p className="text-red-600 text-sm">⚠️ {errors.zip.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-900 border-b border-gray-200 pb-2">
              Financial Information
            </h3>
            
            {/* Employment Status - Vertical */}
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-xl border-l-4 border-teal-500">
                <p className="text-gray-700 font-medium">
                  Are you currently working or on a fixed income?
                </p>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Employment Status *</label>
                <select
                  {...register('employment_status')}
                  className="input-field"
                >
                  <option value="">Select Employment Status</option>
                  <option value="Employed">Employed</option>
                  <option value="Fixed Income">Fixed Income</option>
                </select>
                {errors.employment_status && (
                  <p className="text-red-600 text-sm">⚠️ {errors.employment_status.message}</p>
                )}
              </div>
            </div>
            
            {/* Monthly Income - Vertical */}
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-xl border-l-4 border-teal-500">
                <p className="text-gray-700 font-medium">
                  What is your net monthly income after taxes?
                </p>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Monthly Income *</label>
                <input
                  {...register('monthly_income')}
                  placeholder="$5,000"
                  className="input-field"
                />
                {errors.monthly_income && (
                  <p className="text-red-600 text-sm">⚠️ {errors.monthly_income.message}</p>
                )}
              </div>
            </div>

            {/* Credit Permission - Vertical */}
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-xl border-l-4 border-teal-500">
                <p className="text-gray-700 font-medium">
                  Do I have your permission to run a soft inquiry of your credit report? This will not affect your score.
                </p>
              </div>
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Credit Report Permission
                </label>
                <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <input
                    type="checkbox"
                    {...register('soft_credit_permission')}
                    className="w-5 h-5 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                  />
                  <span className="text-gray-700 font-medium">
                    Authorization
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Verification Information */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-gray-900 border-b border-gray-200 pb-2">
              Verification Information
            </h3>
            
            {/* Date of Birth - Vertical */}
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-xl border-l-4 border-teal-500">
                <p className="text-gray-700 font-medium">
                  Please State your date of birth.
                </p>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Date of Birth *</label>
                <input
                  {...register('DOB')}
                  placeholder="MM/DD/YYYY"
                  onInput={(e) => {
                    e.target.value = maskDOB(e.target.value);
                  }}
                  className="input-field"
                />
                {errors.DOB && (
                  <p className="text-red-600 text-sm">⚠️ {errors.DOB.message}</p>
                )}
              </div>
            </div>
            
            {/* SSN - Vertical */}
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-xl border-l-4 border-teal-500">
                <p className="text-gray-700 font-medium">
                  State the last four digits of your social number.
                </p>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">SSN (Last 4 digits) *</label>
                <div className="flex items-center space-x-2">
                  <span className="text-lg text-gray-500 font-mono">000-00-</span>
                  <input
                    {...register('SSN')}
                    placeholder="1234"
                    maxLength={4}
                    onInput={(e) => {
                      e.target.value = maskSSN(e.target.value);
                    }}
                    className="input-field w-24 text-center font-mono text-lg"
                  />
                </div>
                {errors.SSN && (
                  <p className="text-red-600 text-sm">⚠️ {errors.SSN.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h4 className="font-semibold text-red-800">Submission Error</h4>
                  <p className="text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-primary text-xl py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center space-x-2">
                  <span className="animate-spin">⏳</span>
                  <span>Submitting Application...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center space-x-2">
                  <span>🚀</span>
                  <span>Submit Application</span>
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
