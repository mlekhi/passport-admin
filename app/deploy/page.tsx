import type { Metadata } from "next";
import { DeployUploader } from "../deploy-uploader";

export const metadata: Metadata = {
  title: "Deploy microsite | Passport Admin",
};

export default function DeployPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Deploy microsite</h2>
        <p className="mt-1 text-sm text-black/55 dark:text-white/55">
          Upload a static microsite as a .zip file or select a folder.
        </p>
      </div>

      <DeployUploader />
    </div>
  );
}
