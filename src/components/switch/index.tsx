import { InputHTMLAttributes } from "react";

export default function Switch(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <span
      className={`relative w-8 flex p-1 rounded-full border border-stroke transition-all ${
        props.checked ? "bg-accent" : "bg-stroke"
      }`}
    >
      <span
        className={`shrink-0 w-3 h-3 rounded-full transition-all ${
          props.checked ? "ml-3 bg-white" : "ml-0 bg-foreground"
        }`}
      />
      <input
        {...props}
        type="checkbox"
        className="absolute w-full h-full top-0 left-0 opacity-0 cursor-pointer"
      />
    </span>
  );
}
