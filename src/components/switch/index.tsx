import { InputHTMLAttributes } from "react";

export default function Switch(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <span
      className={`relative w-8 flex p-1 rounded-full border border-gray-400 transition-all ${
        props.checked ? "bg-blue-400" : "bg-gray-200"
      }`}
    >
      <span
        className={`shrink-0 w-3 h-3 rounded-full bg-black transition-all ${
          props.checked ? "ml-3" : "ml-0"
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
