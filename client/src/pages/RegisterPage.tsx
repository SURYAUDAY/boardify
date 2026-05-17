import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, Sparkles } from 'lucide-react';
import api from '../lib/api';
import { useWhiteboardStore } from '../store/whiteboardStore';
import { connectSocket } from '../lib/socket';
import { calculateStrength } from '../lib/passwordStrength';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email'),
    password: z.string().min(8, 'At least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterForm = z.infer<typeof registerSchema>;

const segmentColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500'];
const labelColors: Record<string, string> = {
  Weak: 'text-red-500',
  Fair: 'text-orange-500',
  Good: 'text-yellow-600',
  Strong: 'text-green-500',
  '': '',
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const setUser = useWhiteboardStore((s) => s.setUser);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const password = watch('password') || '';
  const strength = calculateStrength(password);

  const onSubmit = async (data: RegisterForm) => {
    setServerError(null);
    setSubmitting(true);
    try {
      const res = await api.post('/auth/register', {
        name: data.name,
        email: data.email,
        password: data.password,
      });
      const { token, user } = res.data;
      setUser(user, token);
      connectSocket(token);
      navigate('/dashboard');
    } catch (err: any) {
      if (err.response?.status === 409) {
        setServerError('Email already registered');
      } else {
        setServerError('Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#1A1A2E] to-[#16213E] p-4 font-sans">
      <div className="w-full max-w-[400px]">
        <div className="bg-white rounded-2xl shadow-xl p-10">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-[22px] font-semibold text-[#1E293B]">Boardify</span>
          </div>
          <p className="text-lg text-[#374151] text-center mb-8">Create your account</p>

          {serverError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">Your name</label>
              <input
                placeholder="Alex Johnson"
                {...register('name')}
                className="w-full h-10 px-3 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-indigo-500 focus:outline-none text-[#1E293B]"
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">Email address</label>
              <input
                type="email"
                placeholder="you@company.com"
                {...register('email')}
                className="w-full h-10 px-3 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-indigo-500 focus:outline-none text-[#1E293B]"
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  className="w-full h-10 px-3 pr-10 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-indigo-500 focus:outline-none text-[#1E293B]"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-grow flex gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-grow rounded ${i < strength.score ? segmentColors[strength.score - 1] : 'bg-gray-200'}`}
                    />
                  ))}
                </div>
                {strength.label && (
                  <span className={`text-xs ${labelColors[strength.label]}`}>{strength.label}</span>
                )}
              </div>
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">Confirm password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('confirmPassword')}
                className="w-full h-10 px-3 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-indigo-500 focus:outline-none text-[#1E293B]"
              />
              {errors.confirmPassword && (
                <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-[42px] bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 text-white text-[15px] font-semibold rounded-xl flex items-center justify-center gap-2 transition"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Create account
            </button>
          </form>

          <p className="text-center text-xs text-[#9CA3AF] mt-4">
            By signing up you agree to our Terms and Privacy Policy
          </p>
          <p className="text-center text-[13px] text-[#6B7280] mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-500 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
