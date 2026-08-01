import React from 'react'
import Link from 'next/link'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
  size?: 'xs' | 'sm' | 'md' | 'lg'
  href?: string
  children: React.ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  href,
  children,
  className = '',
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  const hasRounded = className.split(' ').some(c => c.startsWith('rounded'))
  let defaultRounded = 'rounded-xl'
  if (size === 'xs' || size === 'sm') {
    defaultRounded = 'rounded-lg'
  }
  const roundedClass = hasRounded ? '' : defaultRounded

  const baseStyles = `inline-flex items-center justify-center gap-1.5 font-semibold ${roundedClass} transition-all duration-150 outline-none active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer`

  const variants = {
    primary: 'bg-sky-700 text-white hover:bg-sky-800 dark:bg-sky-100 dark:text-sky-900 dark:hover:bg-sky-200',
    secondary: 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700',
    outline: 'border border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600',
    ghost: 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900',
  }

  const sizes = {
    xs: 'px-2.5 py-1.5 text-[11px]',
    sm: 'px-3 py-2 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-5 py-3 text-sm',
  }

  const combinedClassName = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`

  if (href) {
    return (
      <Link 
        href={href} 
        className={combinedClassName}
        {...(props as unknown as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
      >
        {children}
      </Link>
    )
  }

  return (
    <button
      type={type}
      disabled={disabled}
      className={combinedClassName}
      {...props}
    >
      {children}
    </button>
  )
}
