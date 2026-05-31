import React, { useState } from 'react';
import { useForm as useRHForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/useToast';
import { CheckCircle2, Layers3, ShieldCheck } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' })
});

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useRHForm({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur'
  });

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const res = await login(data.email, data.password);
      addToast('Logged in successfully', 'success');
      
      if (res.user.role === 'admin') navigate('/admin');
      else if (res.user.role === 'academy_student') navigate('/academy');
      else navigate('/studios');
      
    } catch (err) {
      addToast(err.response?.data?.error || err.response?.data?.message || 'Failed to login', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-start justify-center bg-[#f5f7fb] p-4 py-6 dark:bg-[#1F2937] sm:p-8 lg:items-center">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl shadow-slate-900/12 dark:border-white/[0.08] dark:bg-[#2D3748] dark:shadow-black/20 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="flex flex-col gap-8 border-b border-slate-800 bg-slate-950 p-6 text-white sm:p-8 lg:min-h-[560px] lg:justify-between lg:border-b-0 lg:border-r lg:border-slate-200 lg:p-10 dark:lg:border-white/10">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-lg bg-white text-slate-950 flex items-center justify-center">
                <Layers3 className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">DesignSync</p>
                <p className="text-xs text-slate-400">Enterprise design operations</p>
              </div>
            </div>
            <div className="mt-8 max-w-sm lg:mt-16">
              <p className="text-sm font-semibold uppercase text-teal-300">Secure workspace</p>
              <h1 className="mt-4 text-2xl font-semibold leading-tight sm:text-3xl lg:text-4xl">A clean control center for design delivery.</h1>
              <p className="mt-4 text-sm leading-6 text-slate-300">
                Empower teams to efficiently manage projects, academy reviews, client feedback, and multi-stage approval workflows through a collaborative platform focused on transparency, accountability, and streamlined delivery .
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            {['Approvals', 'Feedback', 'Academy'].map((item) => (
              <div key={item} className="rounded-lg border border-white/10 bg-white/5 p-3">
                <CheckCircle2 className="mb-2 h-4 w-4 text-emerald-300" />
                <p className="font-medium">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="p-6 sm:p-10">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-[#9CA3AF]">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 dark:text-blue-400" />
              Single secure login
            </div>
            <h1 className="mt-5 text-2xl font-semibold text-slate-950 dark:text-white">Welcome back</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Admin, designers, clients, and students all sign in here with their email and password.</p>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Email</label>
              <input 
                {...register('email')}
                type="email" 
                className={`input-field ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="you@company.com"
              />
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Password</label>
              <input 
                {...register('password')}
                type="password" 
                className={`input-field ${errors.password ? 'border-red-500 focus:ring-red-500' : ''}`}
              />
              {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>}
            </div>

            <Button type="submit" className="w-full" isLoading={loading}>
              Sign in
            </Button>
          </form>
          
          <div className="mt-6 border-t border-slate-200 pt-5 text-sm dark:border-white/[0.08]">
            <p className="text-slate-500">
              New to DesignSync? <Link to="/register" className="font-medium text-slate-950 hover:underline dark:text-white">Create an account</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
