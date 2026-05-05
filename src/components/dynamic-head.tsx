import { getAnonClient } from "@lib/supabaseClient";

export async function DynamicHead() {
    const supabase = getAnonClient();
    const { data } = await supabase
        .from("admin_settings")
        .select("value")
        .eq("key", "head_script")
        .single();

    const scriptContent = data?.value || "";

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
