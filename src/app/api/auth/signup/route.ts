import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hash } from "bcrypt";
import { z } from "zod";

const signupSchema = z.object({
  companyName: z.string().min(2, "Company name must be at least 2 characters"),
  companyType: z.enum(["SCHOOL", "CLINIC", "HOSPITAL", "COLLEGE", "UNIVERSITY", "OTHER"]),
  adminName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { companyName, companyType, adminName, email, password } = signupSchema.parse(body);

    // Check if email already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    // Generate slug from company name
    const slug = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Check if slug already exists
    const existingTenant = await db.tenant.findUnique({
      where: { slug },
    });

    if (existingTenant) {
      return NextResponse.json(
        { error: "Company name already taken" },
        { status: 400 }
      );
    }

    // Create tenant and user in a transaction
    const result = await db.$transaction(async (tx) => {
      // Create tenant
      const tenant = await tx.tenant.create({
        data: {
          name: companyName,
          slug,
          companyType,
        },
      });

      // Hash password
      const passwordHash = await hash(password, 10);

      // Create admin user
      const user = await tx.user.create({
        data: {
          name: adminName,
          email,
          passwordHash,
          role: "ADMIN",
          tenantId: tenant.id,
        },
      });

      return { tenant, user };
    });

    return NextResponse.json({
      message: "Account created successfully",
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        slug: result.tenant.slug,
        companyType: result.tenant.companyType,
      },
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
