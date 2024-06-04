import { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "contained" | "outlined";
};

export default function Button(props: Props) {
  const { variant = "contained", className = "", ...domProps } = props;

  const classNameToken: Record<typeof variant, string> = {
    contained: "px-3 py-2 bg-foreground text-background",
    outlined:
      "px-[10px] py-[6px] border-2 bg-transparent border-foreground text-foreground",
  };

  return (
    <button
      {...domProps}
      className={`flex items-center justify-center gap-2 font-medium rounded-md focus:outline focus:outline-2 focus:outline-accent focus:outline-offset-2 transition ${classNameToken[variant]} ${className}`.trim()}
    >
      {domProps.children}
    </button>
  );
}
