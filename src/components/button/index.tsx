import { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "contained" | "outlined";
};

export default function Button(props: Props) {
  const { variant = "contained", className = "", ...domProps } = props;

  const classNameToken: Record<typeof variant, string> = {
    contained: "bg-foreground text-background",
    outlined: "border-2 bg-transparent border-foreground text-foreground",
  };

  return (
    <button
      {...domProps}
      className={`flex items-center justify-center gap-2 font-medium px-3 py-2 rounded-md focus:outline focus:outline-2 focus:outline-accent focus:outline-offset-2 transition ${classNameToken[variant]} ${className}`.trim()}
    >
      {domProps.children}
    </button>
  );
}
