import { type SVGProps } from 'react'

export function IconNavbarSticky(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      data-name='icon-navbar-sticky'
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 79.86 51.14'
      {...props}
    >
      {/* Sidebar */}
      <rect
        x={5.84}
        y={5.02}
        width={19.14}
        height={40}
        rx={2}
        ry={2}
        opacity={0.8}
      />
      <circle cx={10.98} cy={9.91} r={2.54} opacity={0.8} />
      <path
        fill='none'
        opacity={0.72}
        strokeWidth='2px'
        d='M9.02 17.39L21.25 17.39'
      />
      <path
        fill='none'
        opacity={0.48}
        strokeWidth='2px'
        d='M9.02 24.6L19.54 24.6'
      />
      {/* Content area */}
      <rect
        x={30}
        y={5.02}
        width={44}
        height={40}
        rx={2}
        ry={2}
        opacity={0.25}
      />
      {/* Header bar (pinned at top) */}
      <rect
        x={32}
        y={7.02}
        width={40}
        height={5}
        rx={1}
        ry={1}
        opacity={0.7}
      />
      {/* Content lines below pinned header */}
      <rect
        x={32}
        y={15}
        width={36}
        height={2.5}
        rx={0.5}
        ry={0.5}
        opacity={0.3}
      />
      <rect
        x={32}
        y={20}
        width={30}
        height={2.5}
        rx={0.5}
        ry={0.5}
        opacity={0.25}
      />
      <rect
        x={32}
        y={25}
        width={34}
        height={2.5}
        rx={0.5}
        ry={0.5}
        opacity={0.25}
      />
      <rect
        x={32}
        y={30}
        width={26}
        height={2.5}
        rx={0.5}
        ry={0.5}
        opacity={0.2}
      />
      <rect
        x={32}
        y={35}
        width={38}
        height={2.5}
        rx={0.5}
        ry={0.5}
        opacity={0.2}
      />
    </svg>
  )
}
