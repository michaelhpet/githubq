import { Volkhov, Lato } from "next/font/google";

export const volkhov = Volkhov({
  subsets: ["latin"],
  weight: ["700"],
  fallback: ["system-ui", "san-serif"],
});

export const lato = Lato({
  subsets: ["latin"],
  weight: ["400", "700"],
  fallback: ["system-ui", "san-serif"],
});
