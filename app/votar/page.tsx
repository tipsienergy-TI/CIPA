import { redirect } from "next/navigation";
import { getVoterId } from "@/lib/session";
import Ballot from "./Ballot";

export const dynamic = "force-dynamic";

// Só entra na cédula quem se identificou (cookie assinado e ainda válido).
export default async function VotarPage() {
  if (!(await getVoterId())) redirect("/");
  return <Ballot />;
}
