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
        <div dangerouslySetInnerHTML={{ __html: scriptContent }} />
    );
}
