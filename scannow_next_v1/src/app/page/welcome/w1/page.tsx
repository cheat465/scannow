import { redirect } from "next/navigation";

export default function WelcomeDashboardRedirect() {
  redirect("/dashboard");
}
