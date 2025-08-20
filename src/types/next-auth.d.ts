import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    tenantId: string;
    role: "ADMIN" | "STAFF";
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      tenantId: string;
      role: "ADMIN" | "STAFF";
    };
  }
}


