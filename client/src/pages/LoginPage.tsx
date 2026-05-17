import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
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

const DEMO_EMAIL = 'demo@whiteboard.app';
const DEMO_PASSWORD = 'Demo123!';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setUser = useWhiteboardStore((s) => s.setUser);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const isDemoLink = searchParams.get('demo') === 'true';

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  // Autofill demo credentials when arriving via ?demo=true
  useEffect(() => {
    if (isDemoLink) {
      setValue('email', DEMO_EMAIL);
      setValue('password', DEMO_PASSWORD);
    }
  }, [isDemoLink, setValue]);

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

          {isDemoLink && (
            <div className="mb-4 p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-sm text-indigo-700">
              Demo credentials filled in. Click <strong>Sign in</strong> to try Boardify.
            </div>
          )}

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
