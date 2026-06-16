import { useCallback, useEffect, useRef } from 'react'
import { driver, type DriveStep } from 'driver.js'
import 'driver.js/dist/driver.css'
import { useAuth } from './auth'

/**
 * Interactive coach-mark / spotlight product tour.
 *
 * Replaces the old full-screen step-slide wizard. We use driver.js to highlight
 * real UI elements (mostly the sidebar nav links) one at a time with a tooltip
 * and Next/Previous/Done controls, so new staff literally see *where to click*.
 *
 * Completion is persisted in localStorage, keyed per user:
 *   nsrtms_onboarded_<userId> = '1'
 *
 * - Auto-runs once on first login (when the key is absent), after the layout
 *   has mounted so the target elements exist in the DOM.
 * - `start()` re-runs it on demand (e.g. from a Help button) without touching
 *   the auto-show flag.
 * - The "done" flag is written when the tour finishes OR is skipped/closed.
 */

type Side = 'top' | 'right' | 'bottom' | 'left'

interface TourStep {
  selector: string
  title: string
  description: string
  side?: Side
}

function stepsFor(role: string, firstName?: string): TourStep[] {
  const hi = firstName ? `Welcome, ${firstName}!` : 'Welcome!'

  const dashboard: TourStep = {
    selector: '[data-tour="dashboard"]',
    title: 'Dashboard',
    description:
      "Your home base. Live network metrics — samples in transit, turnaround times — and the live map all live here.",
    side: 'right',
  }
  const help: TourStep = {
    selector: '[data-tour="help"]',
    title: 'Need a refresher?',
    description:
      'That\'s the tour! Click "Help / How it works" any time to replay it. Welcome aboard.',
    side: 'top',
  }

  switch (role) {
    case 'admin':
      return [
        { ...dashboard, description: `${hi} ` + dashboard.description },
        {
          selector: '[data-tour="samples"]',
          title: 'Samples',
          description:
            "Track every sample's full journey. Open a row, then click a stage in the tracker to rate or review how that hand-off went.",
          side: 'right',
        },
        {
          selector: '[data-tour="dispatches"]',
          title: 'Dispatches',
          description:
            'Every transport trip across the network — who is carrying what, and where each run is right now.',
          side: 'right',
        },
        {
          selector: '[data-tour="parcels"]',
          title: 'Parcels',
          description:
            'Manage return cargo — the parcels and supplies heading back out to collection sites and facilities.',
          side: 'right',
        },
        {
          selector: '[data-tour="roles"]',
          title: 'Roles & Permissions',
          description:
            'You are the super admin. Under Administration, fine-tune what each role can see and do across the console.',
          side: 'right',
        },
        help,
      ]

    case 'hub_officer':
    case 'lab_officer':
      return [
        { ...dashboard, description: `${hi} ` + dashboard.description },
        {
          selector: '[data-tour="samples"]',
          title: 'Receive incoming samples',
          description:
            'Open Samples to see what is arriving. When a delivery shows up, scan its QR to confirm it was received here.',
          side: 'right',
        },
        {
          selector: '[data-tour="accept"]',
          title: 'Accept a delivery',
          description:
            'This is the one-click shortcut: hit Accept and scan the sample or box to confirm it arrived at your facility.',
          side: 'bottom',
        },
        {
          selector: '[data-tour="parcels"]',
          title: 'Parcels',
          description:
            'Check the return cargo and supplies coming in and out of your facility under Parcels.',
          side: 'right',
        },
        help,
      ]

    case 'dispatcher':
      return [
        { ...dashboard, description: `${hi} ` + dashboard.description },
        {
          selector: '[data-tour="dispatches"]',
          title: 'Dispatches',
          description:
            'Your trips live here. See the samples assigned to you and the route for each run you are carrying.',
          side: 'right',
        },
        {
          selector: '[data-tour="scan"]',
          title: 'Scan to advance',
          description:
            'At each stop, use Scan Sample to scan the QR — that moves the sample to its next stage and logs your location.',
          side: 'right',
        },
        help,
      ]

    case 'collector':
      return [
        { ...dashboard, description: `${hi} ` + dashboard.description },
        {
          selector: '[data-tour="samples"]',
          title: 'Register & collect',
          description:
            'Head to Samples to register a new collection. Each sample gets a QR code that follows it all the way to the lab.',
          side: 'right',
        },
        help,
      ]

    default:
      return [{ ...dashboard, description: `${hi} ` + dashboard.description }, help]
  }
}

export function useTour() {
  const { user } = useAuth()
  const autoRan = useRef(false)

  const key = user ? `nsrtms_onboarded_${user.id}` : null
  const role = user?.role ?? ''
  const firstName = user?.firstName

  const start = useCallback(
    (onComplete?: () => void) => {
      // Only include steps whose target element is actually in the DOM for this
      // role — guards against pointing at nav the user can't see.
      const steps: DriveStep[] = stepsFor(role, firstName)
        .filter((s) => document.querySelector(s.selector))
        .map((s) => ({
          element: s.selector,
          popover: { title: s.title, description: s.description, side: s.side },
        }))

      if (steps.length === 0) {
        onComplete?.()
        return
      }

      const tour = driver({
        showProgress: true,
        allowClose: true,
        overlayColor: 'rgba(2, 6, 12, 0.72)',
        stagePadding: 6,
        stageRadius: 12,
        popoverClass: 'nsrtms-tour',
        nextBtnText: 'Next →',
        prevBtnText: '← Back',
        doneBtnText: 'Done',
        steps,
        onDestroyed: () => onComplete?.(),
      })
      tour.drive()
    },
    [role, firstName],
  )

  const markDone = useCallback(() => {
    if (key) localStorage.setItem(key, '1')
  }, [key])

  /** Replay from the Help button — does NOT alter the auto-show flag. */
  const replay = useCallback(() => {
    start()
  }, [start])

  // Auto-run once per user when they haven't completed onboarding yet. A short
  // delay lets the layout finish mounting so the target elements exist.
  useEffect(() => {
    if (!key || autoRan.current) return
    if (localStorage.getItem(key) === '1') return
    autoRan.current = true
    const t = setTimeout(() => start(markDone), 600)
    return () => clearTimeout(t)
  }, [key, start, markDone])

  return { replay }
}
