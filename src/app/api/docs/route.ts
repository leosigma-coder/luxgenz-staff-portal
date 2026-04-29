import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createDoc, getAllDocs, getDoc, updateDoc, deleteDoc, publishDoc, createAuditLog } from "@/lib/db";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const includeDrafts = session.role !== "staff";
  const docs = await getAllDocs(includeDrafts);
  return NextResponse.json({ docs });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role === "staff") {
    return NextResponse.json(
      { error: "Only admins and the owner can create docs" },
      { status: 403 }
    );
  }

  const { title, content, category, status } = await req.json();
  if (!title || !content) {
    return NextResponse.json(
      { error: "Title and content are required" },
      { status: 400 }
    );
  }

  const isDraft = status === "draft";
  await createDoc(title, content, category || "general", session.username, isDraft ? "draft" : "published");
  await createAuditLog("DOC_CREATE", title, session.username, { status: isDraft ? "draft" : "published" });
  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role === "staff") {
    return NextResponse.json(
      { error: "Only admins and the owner can edit docs" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { id, title, content, category, status: docStatus } = body;
  if (!id || !title || !content) {
    return NextResponse.json(
      { error: "ID, title, and content are required" },
      { status: 400 }
    );
  }

  const doc = await getDoc(id);
  if (!doc) {
    return NextResponse.json({ error: "Doc not found" }, { status: 404 });
  }

  await updateDoc(id, title, content, category || "general", session.username, docStatus);
  await createAuditLog(docStatus === "published" && doc.status === "draft" ? "DOC_PUBLISH" : "DOC_EDIT", title, session.username);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "owner") {
    return NextResponse.json(
      { error: "Only the owner can delete docs" },
      { status: 403 }
    );
  }

  const { id } = await req.json();
  await deleteDoc(id);
  await createAuditLog("DOC_DELETE", `Doc #${id}`, session.username);
  return NextResponse.json({ success: true });
}
