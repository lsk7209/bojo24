import { getAnonClient } from "@lib/supabaseClient";
import { unstable_cache } from "next/cache";

const fetchHeadScript = unstable_cache(
  async () => {
    try {
      const supabase = getAnonClient();
      const { data } = await supabase
        .from("admin_settings")
        .select("value")
        .eq("key", "head_script")
        .maybeSingle();

      return typeof data?.value === "string" ? data.value : "";
    } catch {
      return "";
    }
  },
  ["admin-head-script"],
  { revalidate: 3600 }
);

export async function DynamicHead() {
    const scriptContent = await fetchHeadScript();

    if (!scriptContent) return null;

    return (
        <script
            id="admin-head-script"
            dangerouslySetInnerHTML={{
                __html: scriptContent.replace(/<\/?script[^>]*>/gi, ""),
            }}
        />
    );
}
