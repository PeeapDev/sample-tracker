import { useRef, type ReactNode } from 'react'
import gsap from 'gsap'
import { cn } from '../lib/ui'

/**
 * Card with a GSAP-driven hover effect: a faint accent line sweeps in along the
 * top edge on mouse-over and fades away on mouse-out, with a subtle lift.
 */
export function HoverCard({
  children,
  className,
  onClick,
}: {
  children: ReactNode
  className?: string
  onClick?: () => void
}) {
  const card = useRef<HTMLDivElement>(null)
  const line = useRef<HTMLDivElement>(null)

  function enter() {
    gsap.to(line.current, { scaleX: 1, opacity: 1, duration: 0.45, ease: 'power3.out' })
    gsap.to(card.current, { y: -5, duration: 0.35, ease: 'power3.out' })
  }
  function leave() {
    gsap.to(line.current, { scaleX: 0, opacity: 0, duration: 0.6, ease: 'power2.inOut' })
    gsap.to(card.current, { y: 0, duration: 0.4, ease: 'power2.out' })
  }

  return (
    <div
      ref={card}
      onMouseEnter={enter}
      onMouseLeave={leave}
      onClick={onClick}
      className={cn(
        'card relative overflow-hidden transition-colors hover:border-brand/40',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      <div
        ref={line}
        className="pointer-events-none absolute inset-x-0 top-0 h-px origin-left bg-gradient-to-r from-transparent via-brand to-transparent"
        style={{ transform: 'scaleX(0)', opacity: 0 }}
      />
      {children}
    </div>
  )
}
