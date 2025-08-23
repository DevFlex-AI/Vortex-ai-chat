'use client'
import { useState, useCallback, memo } from 'react'
import { useUser } from '@clerk/nextjs'
import { Crown, Check, Zap, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { SUBSCRIPTION_PLANS, type SubscriptionPlan } from '@/lib/stripe/client'
import { cn } from '@/utils'

interface SubscriptionManagerProps {
  currentPlan: SubscriptionPlan
  onPlanChange: (plan: SubscriptionPlan) => void
  className?: string
}

function getPlanIcon(planId: SubscriptionPlan) {
  switch (planId) {
    case 'FREE':
      return <Zap className="h-5 w-5" />
    case 'PRO':
      return <Crown className="h-5 w-5" />
    case 'TEAM':
      return <Users className="h-5 w-5" />
    default:
      return <Zap className="h-5 w-5" />
  }
}

function SubscriptionManager({ currentPlan, onPlanChange, className }: SubscriptionManagerProps) {
  const { user } = useUser()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const handleUpgrade = useCallback(async (planId: SubscriptionPlan) => {
    if (!user) return

    setIsLoading(planId)
    try {
      // Create Stripe checkout session
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId,
          userId: user.id,
          userEmail: user.emailAddresses[0]?.emailAddress,
        }),
      })

      const { url } = await response.json()
      
      if (url) {
        window.location.href = url
      } else {
        throw new Error('Failed to create checkout session')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to start upgrade process. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(null)
    }
  }, [user, toast])

  const handleManageBilling = useCallback(async () => {
    if (!user) return

    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      })

      const { url } = await response.json()
      
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to open billing portal. Please try again.',
        variant: 'destructive',
      })
    }
  }, [user, toast])

  return (
    <div className={cn('space-y-6', className)}>
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Choose Your Plan</h2>
        <p className="text-muted-foreground">
          Unlock the full potential of AI-powered conversations
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(SUBSCRIPTION_PLANS).map(([planKey, plan]) => {
          const planId = planKey as SubscriptionPlan
          const isCurrentPlan = currentPlan === planId
          const isPopular = planId === 'PRO'

          return (
            <Card
              key={planId}
              className={cn(
                'relative overflow-hidden transition-all duration-200',
                isCurrentPlan && 'ring-2 ring-primary',
                isPopular && 'scale-105 shadow-lg'
              )}
            >
              {isPopular && (
                <div className="absolute top-0 left-0 right-0 bg-primary text-primary-foreground text-center py-1">
                  <span className="text-xs font-medium">Most Popular</span>
                </div>
              )}

              <CardHeader className={cn('text-center', isPopular && 'pt-8')}>
                <div className="flex justify-center mb-2">
                  {getPlanIcon(planId)}
                </div>
                <CardTitle className="flex items-center justify-center gap-2">
                  {plan.name}
                  {isCurrentPlan && (
                    <Badge variant="secondary" className="text-xs">
                      Current
                    </Badge>
                  )}
                </CardTitle>
                <div className="text-3xl font-bold">
                  ${plan.price}
                  <span className="text-sm font-normal text-muted-foreground">
                    {plan.price > 0 ? '/month' : ''}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="pt-4">
                  {isCurrentPlan ? (
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={handleManageBilling}
                    >
                      Manage Billing
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => handleUpgrade(planId)}
                      disabled={isLoading === planId}
                    >
                      {isLoading === planId ? 'Processing...' : 
                       planId === 'FREE' ? 'Downgrade' : 'Upgrade'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <h3 className="font-medium">Need a custom solution?</h3>
            <p className="text-sm text-muted-foreground">
              Contact us for enterprise pricing and custom integrations
            </p>
            <Button variant="outline" size="sm">
              Contact Sales
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default memo(SubscriptionManager)