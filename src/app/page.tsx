import { redirect } from "next/navigation";

// Korijen vodi u aplikaciju; neulogovane middleware preusmjeri na /login.
export default function Home() {
  redirect("/dashboard");
}
