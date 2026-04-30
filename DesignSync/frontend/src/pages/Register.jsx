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
    <div className="min-h-screen bg-[#f6f7f9] dark:bg-[#0b0d12] flex items-center justify-center p-4 sm:p-8">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl shadow-slate-200/70 dark:border-slate-800 dark:bg-[#11151c] dark:shadow-black/30 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="hidden lg:flex flex-col justify-between border-r border-slate-200 bg-slate-950 p-10 text-white dark:border-slate-800">
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
            <div className="mt-16">
              <p className="text-sm font-semibold uppercase tracking-wider text-amber-300">Student access</p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight">Start academy work with a verified student account.</h1>
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
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="h-10 w-10 rounded-lg bg-slate-950 text-white flex items-center justify-center dark:bg-white dark:text-slate-950">
              <Layers3 className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-slate-950 dark:text-white">DesignSync</p>
              <p className="text-xs text-slate-500">Enterprise workspace setup</p>
            </div>
          </div>

          <div className="mb-8">
            <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-[#0f131a] dark:text-slate-300">
              <Building2 className="h-3.5 w-3.5 text-teal-500" />
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
          
          <div className="mt-6 flex items-start gap-3 border-t border-slate-200 pt-5 text-sm dark:border-slate-800">
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
