import { NextResponse } from "next/server";
import { db } from "@/lib/db"; // your Prisma client
import { auth } from "@/auth";

// GET all categories
export async function GET() {
  const session = await auth();

  if (!session || !session.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const categories = await db.productCategory.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(categories);
  } catch (err) {
    console.error("Error fetching category", err);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 },
    );
  }
}

// POST new category
export async function POST(req: Request) {
  const session = await auth();

  if (!session || !session.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const { name } = await req.json();
    const normalizedName = name.trim().toLowerCase(); // Standardize here

    const existingCategory = await db.productCategory.findFirst({
      where: {
        name: normalizedName, // Look for the standardized version
      },
    });

    if (existingCategory) {
      return NextResponse.json(
        { error: "Category name already exists." },
        { status: 400 },
      );
    }

    // Create new category using the normalized name
    const category = await db.productCategory.create({
      data: { name: normalizedName },
    });

    // Audit log - Use name.trim() or category.name for the description
    await db.auditLog.create({
      data: {
        userId,
        action: "Added Category",
        entityType: "Product",
        description: `User ${session.user.username} added category "${normalizedName}".`,
      },
    });

    return NextResponse.json(category);
  } catch (err) {
    console.error("Error adding category", err);
    return NextResponse.json(
      { error: "Failed to add category" },
      { status: 500 },
    );
  }
}
