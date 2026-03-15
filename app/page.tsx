'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { Youtube, User, LogOut } from 'lucide-react'
import LandingPage from '@/app/components/LandingPage'
import UploadScreen from '@/app/components/UploadScreen'

export default function HomePage() {
  const { data: session, status } = useSession()

  return (
    <div className="min-h-screen relative font-sans text-gray-300 selection:bg-youtube-neon selection:text-black pb-8 overflow-x-hidden">
      {/* Structural Wireframe Overlay */}
      <div className="fixed inset-0 pointer-events-none z-[-1] opacity-30">
        <div className="absolute top-0 left-4 md:left-10 lg:left-20 w-[1px] h-full bg-yt-border"></div>
        <div className="absolute top-0 right-4 md:right-10 lg:right-20 w-[1px] h-full bg-yt-border"></div>
      </div>

      {/* Clean Studio Header */}
      <header className="border-b border-yt-border bg-yt-bg/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 md:px-10 lg:px-20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 sm:py-0 sm:h-20 gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-yt-red rounded-xl flex items-center justify-center relative overflow-hidden flex-shrink-0">
                <Youtube className="text-yt-text-primary relative z-10" size={24} />
              </div>
              <div className="flex flex-col">
                <h1 className="text-lg md:text-xl font-medium text-yt-text-primary tracking-tight">
                  YouTube Uploader
                </h1>
                <span className="text-[10px] md:text-xs text-yt-text-secondary mt-0.5">
                  Studio Interface // {session ? 'Connected' : 'Offline'}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4 ml-auto">
              {session ? (
                <div className="flex items-center space-x-4 md:space-x-6">
                  <div className="hidden sm:flex flex-col text-right">
                    <span className="text-sm font-medium text-yt-text-primary">{session.user?.name}</span>
                    <span className="text-xs text-green-500 flex items-center justify-end">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                      Connected
                    </span>
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="flex items-center text-yt-text-secondary hover:text-yt-text-primary text-sm font-medium transition-colors duration-200 px-3 py-1.5 md:px-4 md:py-2 rounded-full hover:bg-yt-hover"
                  >
                    <LogOut className="mr-2" size={14} />
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => signIn('google')}
                  className="btn-primary flex items-center py-2 px-4 md:py-3 md:px-6 text-xs md:text-sm"
                >
                  <User className="mr-2 md:mr-3" size={16} />
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 md:px-10 lg:px-20 py-8 md:py-12">
        {!session ? <LandingPage /> : <UploadScreen session={session!} />}
      </main>
    </div>
  )
}



