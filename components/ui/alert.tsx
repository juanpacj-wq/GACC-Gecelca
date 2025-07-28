// components/ui/alert.tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Definimos una interfaz básica para las props
interface BasicProps {
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface AlertProps extends BasicProps {
  variant?: "default" | "destructive";
}

// Componentes simples con tipos básicos
const Alert = (props: AlertProps) => {
  const { className, variant = "default", ...rest } = props;
  
  return (
    <div
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...rest}
    />
  );
}

const AlertTitle = (props: BasicProps) => {
  const { className, ...rest } = props;
  
  return (
    <h5
      className={cn("mb-1 font-medium leading-none tracking-tight", className)}
      {...rest}
    />
  );
}

const AlertDescription = (props: BasicProps) => {
  const { className, ...rest } = props;
  
  return (
    <div
      className={cn("text-sm [&_p]:leading-relaxed", className)}
      {...rest}
    />
  );
}

export { Alert, AlertTitle, AlertDescription }