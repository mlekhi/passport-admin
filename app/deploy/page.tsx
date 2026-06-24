import type { Metadata } from "next";
import { DeployUploader } from "../deploy-uploader";

export const metadata: Metadata = {
  title: "Deploy microsite | Passport Admin",
};

export default function DeployPage() {
  return <DeployUploader />;
}
