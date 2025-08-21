import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, channelProvider, content, variables } = await request.json();

    if (!name || !channelProvider || !content) {
      return NextResponse.json({ error: "Name, channel provider, and content are required" }, { status: 400 });
    }

    // Check if template with same name already exists
    const existingTemplate = await db.template.findFirst({
      where: {
        name,
        tenantId: session.user.tenantId
      }
    });

    if (existingTemplate) {
      return NextResponse.json({ error: "Template with this name already exists" }, { status: 400 });
    }

    // Create new template
    const template = await db.template.create({
      data: {
        name,
        channelProvider,
        content,
        variables: variables || [],
        tenantId: session.user.tenantId
      }
    });

    return NextResponse.json({
      success: true,
      template: {
        id: template.id,
        name: template.name,
        channelProvider: template.channelProvider,
        content: template.content,
        variables: template.variables,
        createdAt: template.createdAt
      }
    });

  } catch (error: any) {
    console.error("Template creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const templates = await db.template.findMany({
      where: { tenantId: session.user.tenantId },
      select: {
        id: true,
        name: true,
        channelProvider: true,
        content: true,
        variables: true,
        isApproved: true,
        createdAt: true
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(templates);

  } catch (error: any) {
    console.error("Template fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


