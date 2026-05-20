import Image from 'next/image'
import { LoginForm } from '@/components/auth/login-form'

export default function LoginPage() {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-end overflow-hidden">
      {/* Background Image with Glassmorphism Effect */}
      <div className="absolute inset-0">
        <Image
          src="/fellowship.png"
          alt="Background"
          fill
          className="object-cover"
          priority
        />
        {/* Glassmorphism overlay */}
        <div 
          className="absolute inset-0" 
          style={{
            background: 'rgba(0, 6, 102, 0.3)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        />
      </div>

      {/* Logo - Left Side */}
      <div className="absolute left-8 md:left-12 top-8 md:top-12 z-10">
        <Image
          src="/logo-white-bg.png"
          alt="RCCG Glory Tabernacle, Barnstaple"
          width={120}
          height={60}
          className="rounded-lg shadow-lg"
        />
      </div>

      {/* Login Card - Right Side */}
      <div className="relative z-10 w-full max-w-md mx-4 mr-8 md:mr-24 lg:mr-32">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 md:p-10">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'rgba(27, 34, 119, 1)' }}>
            Sign in
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            Access the dashboard
          </p>

          <LoginForm />
        </div>
      </div>
    </div>
  )
}
