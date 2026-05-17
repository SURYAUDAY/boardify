import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, Sparkles } from 'lucide-react';
import api from '../lib/api';
import { useWhiteboardStore } from '../store/whiteboardStore';
import { connectSocket } from '../lib/socket';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Minimum 8 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const setUser = useWhiteboardStore((s) => s.setUser);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setServerError(null);
    setSubmitting(true);
    try {
      const res = await api.post('/auth/login', data);
      const { token, user } = res.data;
      setUser(user, token);
      connectSocket(token);
      navigate('/dashboard');
    } catch (err: any) {
      if (err.response?.status === 401) {
        setServerError('Invalid email or password');
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
          <p className="text-lg text-[#374151] text-center mb-8">Sign in to your workspace</p>

          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 py-2.5 border border-[#E5E7EB] rounded-lg text-sm text-[#374151] hover:bg-gray-50 transition"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-grow h-px bg-[#E5E7EB]" />
            <span className="text-xs text-[#9CA3AF]">or</span>
            <div className="flex-grow h-px bg-[#E5E7EB]" />
          </div>

          {serverError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-[13px] font-semibold text-[#374151] mb-1.5">Email</label>
              <input
                type="email"
                placeholder="you@company.com"
                {...register('email')}
                className="w-full h-10 px-3 rounded-lg border border-[#D1D5DB] focus:ring-2 focus:ring-indigo-500 focus:outline-none text-[#1E293B]"
              />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex justify-between items-baseline mb-1.5">
                <label className="block text-[13px] font-semibold text-[#374151]">Password</label>
                <a className="text-[13px] text-indigo-500 hover:underline">Forgot password?</a>
              </div>
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
              {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-[42px] bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 text-white text-[15px] font-semibold rounded-xl flex items-center justify-center gap-2 transition"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Sign in
            </button>
          </form>

          <p className="text-center text-[13px] text-[#6B7280] mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-500 font-medium hover:underline">
              Create one
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-[#9CA3AF] mt-4">🔒 Your data is encrypted and secure</p>

        {import.meta.env.DEV && (
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText('demo@whiteboard.app\nDemo123!')}
            className="w-full mt-4 text-xs text-[#94A3B8] hover:text-white text-center"
          >
            Demo: demo@whiteboard.app / Demo123! (click to copy)
          </button>
        )}
      </div>
    </div>
  );
}
