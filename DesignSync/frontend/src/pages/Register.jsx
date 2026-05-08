import React, { useState } from 'react';
import { useForm as useRHForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/useToast';
import { Building2, Layers3, LockKeyhole } from 'lucide-react';

const registerSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

const Register = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useRHForm({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur'
  });

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const res = await registerUser({ ...data, role: 'academy_student' });
      addToast('Registered successfully', 'success');
      
      if (res.user.role === 'admin') navigate('/admin');
      else if (res.user.role === 'academy_student') navigate('/academy');
      else navigate('/studios');
    } catch (err) {
      addToast(err.response?.data?.error || 'Failed to register', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-start justify-center bg-[#f5f7fb] p-4 py-6 dark:bg-[#1F2937] sm:p-8 lg:items-center">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl shadow-slate-900/12 dark:border-white/[0.08] dark:bg-[#2D3748] dark:shadow-black/20 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="flex flex-col gap-8 border-b border-slate-800 bg-slate-950 p-6 text-white sm:p-8 lg:min-h-[560px] lg:justify-between lg:border-b-0 lg:border-r lg:border-slate-200 lg:p-10 dark:lg:border-white/10">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-lg bg-white text-slate-950 flex items-center justify-center">
                <Layers3 className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">DesignSync</p>
                <p className="text-xs text-slate-400">Enterprise workspace setup</p>
              </div>
            </div>
            <div className="mt-8 lg:mt-16">
              <p className="text-sm font-semibold uppercase text-amber-300">Student access</p>
              <h1 className="mt-4 text-2xl font-semibold leading-tight sm:text-3xl lg:text-4xl">Start academy work with a verified student account.</h1>
              <p className="mt-4 text-sm leading-6 text-slate-300">
                Designers and clients sign in with IDs created by the admin, while students can register directly for academy assignments.
              </p>
            </div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-medium">Workspace theme</p>
            <p className="mt-1 text-xs leading-5 text-slate-300">Clean light and dark modes are available across every dashboard.</p>
          </div>
        </section>

        <div className="p-6 sm:p-10">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-white/[0.08] dark:bg-white/[0.05] dark:text-[#9CA3AF]">
              <Building2 className="h-3.5 w-3.5 text-teal-500 dark:text-blue-400" />
              Academy student account
            </div>
            <h1 className="mt-5 text-2xl font-semibold text-slate-950 dark:text-white">Create your account</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Student registration is open. Designer and client IDs are created by the admin.</p>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Full name</label>
              <input 
                {...register('name')}
                type="text" 
                className={`input-field ${errors.name ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Avery Stone"
              />
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Work email</label>
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
              Create student account
            </Button>
          </form>
          
          <div className="mt-6 flex items-start gap-3 border-t border-slate-200 pt-5 text-sm dark:border-white/[0.08]">
            <LockKeyhole className="mt-0.5 h-4 w-4 text-slate-400" />
            <p className="text-slate-500">
              Already have access? <Link to="/login" className="font-medium text-slate-950 hover:underline dark:text-white">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
