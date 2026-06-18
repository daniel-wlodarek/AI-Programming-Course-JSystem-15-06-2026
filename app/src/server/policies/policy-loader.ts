import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { type RequestType } from "@/shared/contracts";

export interface PolicyDocument {
  requestType: RequestType;
  path: string;
  text: string;
}

const POLICY_PATHS: Record<RequestType, string> = {
  RETURN: "docs/policies/polityka-zwrotow.md",
  COMPLAINT: "docs/policies/polityka-reklamacji.md",
};

const POLICY_FILES: Record<RequestType, string> = {
  RETURN: "polityka-zwrotow.md",
  COMPLAINT: "polityka-reklamacji.md",
};

export async function loadPolicy(
  requestType: RequestType,
): Promise<PolicyDocument> {
  const relativePath = POLICY_PATHS[requestType];
  const absolutePath = join(
    process.cwd(),
    "src/server/policies/documents",
    POLICY_FILES[requestType],
  );

  return {
    requestType,
    path: relativePath,
    text: await readFile(absolutePath, "utf8"),
  };
}
