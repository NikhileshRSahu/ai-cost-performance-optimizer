import Link from 'next/link';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';

type EvalButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

const variants: Record<EvalButtonVariant, string> = {
  primary: 'eval-button eval-button--primary',
  secondary: 'eval-button eval-button--secondary',
  ghost: 'eval-button eval-button--ghost',
  danger: 'eval-button eval-button--danger',
};

type SharedProps = Readonly<{
  variant?: EvalButtonVariant;
  className?: string;
  children: ReactNode;
}>;

type LinkProps = SharedProps & { href: string };
type ButtonProps = SharedProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> & {
    href?: undefined;
  };

export function EvalButton(props: LinkProps | ButtonProps) {
  const { variant = 'primary', className, children } = props;
  const classes = cn(variants[variant], className);

  if ('href' in props && typeof props.href === 'string') {
    return (
      <Link href={props.href} className={classes}>
        {children}
      </Link>
    );
  }

  const {
    href: _href,
    variant: _variant,
    className: _className,
    children: _children,
    ...nativeProps
  } = props as ButtonProps & { href?: undefined };
  return (
    <button {...nativeProps} className={classes}>
      {children}
    </button>
  );
}
