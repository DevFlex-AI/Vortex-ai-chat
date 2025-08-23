'use client'
import { ClerkProvider, SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import { dark } from '@clerk/themes'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'

interface AuthWrapperProps {
  children: React.ReactNode
}

function AuthWrapper({ children }: AuthWrapperProps) {
  const { theme } = useTheme()

  return (
    <ClerkProvider
      appearance={{
        baseTheme: theme === 'dark' ? dark : undefined,
        variables: {
          colorPrimary: 'hsl(var(--primary))',
          colorBackground: 'hsl(var(--background))',
          colorText: 'hsl(var(--foreground))',
        },
      }}
    >
      <SignedOut>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="max-w-md w-full space-y-8 p-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold">Welcome to Vortex AI</h2>
              <p className="mt-2 text-muted-foreground">
                Sign in to access your personalized AI chat experience
              </p>
            </div>
            <div className="space-y-4">
              <SignInButton mode="modal">
                <Button className="w-full" size="lg">
                  Sign In
                </Button>
              </SignInButton>
              <p className="text-center text-sm text-muted-foreground">
                New to Vortex AI? Signing in will create your account automatically.
              </p>
            </div>
          </div>
        </div>
      </SignedOut>
      <SignedIn>
        {children}
      </SignedIn>
    </ClerkProvider>
  )
}

export default AuthWrapper