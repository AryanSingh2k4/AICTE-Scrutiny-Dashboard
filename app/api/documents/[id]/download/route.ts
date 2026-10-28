// ==============================================================================
// ScrutiniX AICTE Scrutiny Engine — Document Download Endpoint
// Academic Year 2026–27 | Signed URL for evidence stored in Supabase Storage
// ==============================================================================

import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getServerSupabase();

    const { data: document, error } = await supabase
      .from("documents")
      .select("id, file_name, storage_path")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }
    if (!document.storage_path) {
      return NextResponse.json({ error: "This document has no stored file" }, { status: 404 });
    }

    const { data: signed, error: signError } = await supabase.storage
      .from("documents")
      .createSignedUrl(document.storage_path, 120);

    if (signError || !signed?.signedUrl) {
      return NextResponse.json(
        { error: signError?.message || "Could not create a download link" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: signed.signedUrl, fileName: document.file_name });
  } catch (err: any) {
    console.error("GET /api/documents/[id]/download error:", err);
    return NextResponse.json({ error: err?.message || "Unable to prepare download" }, { status: 500 });
  }
}
