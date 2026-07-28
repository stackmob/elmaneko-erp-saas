import React, { useState } from 'react';
import { Shield, Eye, EyeOff, Loader2, KeyRound } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    if (!email.includes('@') || email.length < 5) {
      setErrorMessage('Por favor, informe um endereço de e-mail válido.');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setErrorMessage('A senha deve conter no mínimo 6 caracteres.');
      setIsLoading(false);
      return;
    }

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setErrorMessage(error.message);
      } else {
        setSuccessMessage('Conta criada com sucesso! Verifique seu e-mail ou faça login (se o e-mail não exigir confirmação).');
        setIsSignUp(false);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMessage(error.message);
      }
    }
    
    setIsLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    if (!recoveryEmail.includes('@')) {
      setErrorMessage('Por favor, informe um e-mail válido para a recuperação.');
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(recoveryEmail);

    if (error) {
      setErrorMessage(error.message);
    } else {
      setSuccessMessage('E-mail de recuperação de senha enviado com sucesso! Verifique sua caixa de entrada.');
      setTimeout(() => {
        setIsForgotPassword(false);
        setSuccessMessage('');
      }, 4000);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4 relative overflow-hidden" id="auth-page-container">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-8 relative z-10">
        <div className="flex flex-col items-center mb-8" id="auth-logo-section">
          <div className="w-16 h-16 bg-gradient-to-tr from-orange-600 to-amber-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(234,88,12,0.3)] border border-orange-500/20 mb-3">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-wider text-white">ELMANEKO <span className="text-orange-500">SaaS</span></h1>
          <p className="text-xs text-neutral-400 mt-1 uppercase tracking-widest font-mono">Gestão Empresarial</p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-950/50 border border-red-800 text-red-200 text-sm rounded-lg flex items-center gap-2 animate-pulse" id="auth-error-alert">
            <span className="font-bold">Erro:</span> {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-emerald-950/50 border border-emerald-800 text-emerald-200 text-sm rounded-lg flex items-center gap-2" id="auth-success-alert">
            {successMessage}
          </div>
        )}

        {!isForgotPassword ? (
          <form onSubmit={handleLogin} className="space-y-5" id="login-form">
            <div>
              <label className="block text-xs font-mono text-neutral-400 uppercase tracking-wider mb-2" htmlFor="login-email">
                E-mail Administrativo
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-colors"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-mono text-neutral-400 uppercase tracking-wider" htmlFor="login-password">
                  Senha de Acesso
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotPassword(true)}
                  className="text-xs text-orange-500 hover:text-orange-400 font-mono transition-colors focus:outline-none"
                >
                  Esqueci a senha
                </button>
              </div>
              
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-4 pr-12 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 bg-orange-600 hover:bg-orange-500 active:bg-orange-700 text-white font-semibold rounded-xl shadow-lg shadow-orange-600/20 flex items-center justify-center gap-2 hover:translate-y-[-1px] transition-all duration-200 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Autenticando na nuvem...
                </>
              ) : (
                <>
                  <KeyRound size={18} />
                  {isSignUp ? 'Criar Conta' : 'Entrar no Sistema'}
                </>
              )}
            </button>
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => { setIsSignUp(!isSignUp); setErrorMessage(''); setSuccessMessage(''); }}
                className="text-xs text-neutral-400 hover:text-white transition-colors"
              >
                {isSignUp ? 'Já tem uma conta? Faça login' : 'Não tem conta? Cadastre-se'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleForgotPassword} className="space-y-5" id="recovery-form">
            <p className="text-sm text-neutral-400 leading-relaxed">
              Informe seu e-mail cadastrado. Enviaremos um link de recuperação via Supabase.
            </p>

            <div>
              <label className="block text-xs font-mono text-neutral-400 uppercase tracking-wider mb-2" htmlFor="recovery-email">
                E-mail Cadastrado
              </label>
              <input
                id="recovery-email"
                type="email"
                required
                value={recoveryEmail}
                onChange={(e) => setRecoveryEmail(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-colors"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsForgotPassword(false)}
                className="flex-1 py-3 px-4 border border-neutral-800 hover:bg-neutral-800/50 text-neutral-300 font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Voltar
              </button>
              
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-3 px-4 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-xl shadow-lg shadow-orange-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  'Recuperar'
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="mt-8 text-center text-xs text-neutral-600 font-mono relative z-10">
        ELMANEKO 3D SaaS v2.0 • Supabase Auth Ativado
      </div>
    </div>
  );
}
